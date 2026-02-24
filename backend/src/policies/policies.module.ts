import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Policy } from './policy.entity';
import { PolicyCategory } from './policy-category.entity';
import { PolicyAcknowledgement } from './policy-ack.entity';
import { PolicyVersion } from './policy-version.entity';
import { PolicyWorkflowEvent } from './policy-workflow-event.entity';
import { PolicyAcknowledgementScope } from './policy-ack-scope.entity';
import { Application } from '../applications/application.entity';
import { Asset } from '../assets/asset.entity';
import { SoftwareLicense } from '../assets/software-license.entity';
import { PoliciesService } from './policies.service';
import { PoliciesController } from './policies.controller';
import { PolicyReminderService } from './policy-reminder.service';
import { NotifierService } from '../notifications/notifier.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([
    Policy,
    PolicyCategory,
    PolicyAcknowledgement,
    PolicyVersion,
    PolicyWorkflowEvent,
    PolicyAcknowledgementScope,
    Application,
    Asset,
    SoftwareLicense,
  ]), UsersModule],
  controllers: [PoliciesController],
  providers: [PoliciesService, PolicyReminderService, NotifierService],
  exports: [PoliciesService],
})
export class PoliciesModule {}
