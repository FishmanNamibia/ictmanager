import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PoliciesService } from './policies.service';
import { AuditService } from '../audit/audit.service';
import { NotifierService } from '../notifications/notifier.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class PolicyReminderService {
  private readonly logger = new Logger(PolicyReminderService.name);
  constructor(
    private readonly policiesService: PoliciesService,
    private readonly auditService: AuditService,
    private readonly notifier: NotifierService,
    private readonly notificationsService: NotificationsService,
    private readonly tenantService: TenantService,
  ) {}

  // Run daily at 02:00
  @Cron('0 0 2 * * *')
  async handleDaily() {
    try {
      const tenants = await this.tenantService.findAllActive();
      if (!tenants.length) return;

      // Days to check: 60, 30, 0 (today)
      const daysToCheck = [60, 30, 0];
      for (const tenant of tenants) {
        for (const days of daysToCheck) {
          const due = await this.policiesService.getDueInDays(tenant.id, days);
          if (due.length) {
            this.logger.log(`Tenant ${tenant.slug}: policies due in ${days} days: ${due.length}`);
            for (const p of due) {
              await this.auditService.log({
                tenantId: p.tenantId,
                userId: null,
                action: 'policy.review_reminder',
                entityType: 'policy',
                entityId: p.id,
                metadata: { days, title: p.title, nextReviewDue: p.nextReviewDue },
              });

              // Send email to unacknowledged users for this policy.
              const users = await this.policiesService.getUnacknowledgedUsers(p.tenantId, p.id);
              for (const user of users) {
                const subject = `Policy review reminder: ${p.title} (${days} days)`;
                const body = `<p>Dear ${user.fullName},</p><p>The policy <strong>${p.title}</strong> is due for review on <strong>${p.nextReviewDue?.toISOString().slice(0,10) || 'N/A'}</strong>. Please review and acknowledge.</p>`;
                await this.notificationsService.createForUser({
                  tenantId: p.tenantId,
                  userId: user.id,
                  type: 'policy_review_reminder',
                  severity: days === 0 ? 'warning' : 'info',
                  title: `Policy review due: ${p.title}`,
                  message: `This policy is due for review on ${p.nextReviewDue?.toISOString().slice(0, 10) || 'N/A'}. Please review and acknowledge it.`,
                  linkUrl: `/policies/${p.id}`,
                  metadata: { policyId: p.id, days, nextReviewDue: p.nextReviewDue?.toISOString() ?? null },
                  externalKey: `policy-review:${user.id}:${p.id}:${days}:${new Date().toISOString().slice(0, 10)}`,
                });
                await this.notifier.sendEmail(user.email, subject, body, `Please review policy ${p.title} due ${p.nextReviewDue}`);
              }
            }
          }
        }
      }
    } catch (e) {
      this.logger.error(e);
    }
  }
}
