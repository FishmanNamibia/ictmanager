import { Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TenantId } from '../auth/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/user.entity';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(
    @TenantId() tenantId: string,
    @CurrentUser() user: User,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.notificationsService.listForUser(tenantId, user.id, limit);
  }

  @Post('read-all')
  async markAllRead(@TenantId() tenantId: string, @CurrentUser() user: User) {
    return this.notificationsService.markAllRead(tenantId, user.id);
  }

  @Post(':id/read')
  async markRead(@TenantId() tenantId: string, @CurrentUser() user: User, @Param('id') id: string) {
    return this.notificationsService.markRead(tenantId, user.id, id);
  }
}
