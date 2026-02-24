import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChangeRequest, ReleaseRecord } from './entities';
import { ChangeManagementController } from './change-management.controller';
import { ChangeManagementService } from './change-management.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChangeRequest, ReleaseRecord])],
  controllers: [ChangeManagementController],
  providers: [ChangeManagementService],
  exports: [ChangeManagementService],
})
export class ChangeManagementModule {}

