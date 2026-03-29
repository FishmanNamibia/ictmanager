import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { AuditLog } from '../audit/audit-log.entity';
import { User } from '../users/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { Tenant } from '../tenant/tenant.entity';
import { Asset } from './asset.entity';
import { AssetDocument } from './asset-document.entity';
import { AssetMovement } from './asset-movement.entity';
import { AssetVerification } from './asset-verification.entity';
import { SoftwareLicense } from './software-license.entity';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { AssetsImportController } from './assets-import.controller';
import { AssetsMonitoringService } from './assets-monitoring.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asset, AssetMovement, AssetVerification, AssetDocument, SoftwareLicense, AuditLog, User, Tenant]),
    NotificationsModule,
    MulterModule.register({}),
  ],
  providers: [AssetsService, AssetsMonitoringService],
  controllers: [AssetsImportController, AssetsController],
  exports: [AssetsService],
})
export class AssetsModule {}
