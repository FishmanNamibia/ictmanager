import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { NotifierService } from './notifier.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  providers: [NotifierService, NotificationsService],
  controllers: [NotificationsController],
  exports: [NotifierService, NotificationsService],
})
export class NotificationsModule {}
