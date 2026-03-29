import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Notification, NotificationSeverity } from './notification.entity';

type CreateNotificationInput = {
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  severity?: NotificationSeverity;
  linkUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  externalKey?: string | null;
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async listForUser(tenantId: string, userId: string, limit = 12) {
    const take = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 50)) : 12;
    const [items, unreadCount] = await Promise.all([
      this.notificationRepo.find({
        where: { tenantId, userId },
        order: { readAt: 'ASC', createdAt: 'DESC' },
        take,
      }),
      this.notificationRepo.count({
        where: { tenantId, userId, readAt: IsNull() },
      }),
    ]);

    return { items, unreadCount };
  }

  async markRead(tenantId: string, userId: string, id: string) {
    const notification = await this.notificationRepo.findOne({
      where: { id, tenantId, userId },
    });
    if (!notification) return null;
    if (!notification.readAt) {
      notification.readAt = new Date();
      await this.notificationRepo.save(notification);
    }
    return notification;
  }

  async markAllRead(tenantId: string, userId: string) {
    await this.notificationRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ readAt: () => 'CURRENT_TIMESTAMP' })
      .where('"tenant_id" = :tenantId', { tenantId })
      .andWhere('"user_id" = :userId', { userId })
      .andWhere('"readAt" IS NULL')
      .execute();

    return this.listForUser(tenantId, userId);
  }

  async createForUser(input: CreateNotificationInput) {
    if (input.externalKey) {
      const existing = await this.notificationRepo.findOne({
        where: { externalKey: input.externalKey },
      });
      if (existing) return existing;
    }

    const entity = this.notificationRepo.create({
      tenantId: input.tenantId,
      userId: input.userId,
      type: input.type,
      severity: input.severity ?? 'info',
      title: input.title,
      message: input.message,
      linkUrl: input.linkUrl ?? null,
      metadata: input.metadata ?? null,
      externalKey: input.externalKey ?? null,
      readAt: null,
    });
    return this.notificationRepo.save(entity);
  }

  async ensureWelcomeNotification(user: User) {
    return this.createForUser({
      tenantId: user.tenantId,
      userId: user.id,
      type: 'system_welcome',
      severity: 'info',
      title: 'Notifications are now active',
      message: 'Policy reminders and workflow alerts will appear here as they are generated.',
      linkUrl: '/dashboard',
      externalKey: `system-welcome:${user.id}`,
    });
  }
}
