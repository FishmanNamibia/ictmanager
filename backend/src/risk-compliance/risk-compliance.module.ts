import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsModule } from '../applications/applications.module';
import { StaffModule } from '../staff/staff.module';
import { AuditFinding, DisasterRecoveryPlan, RiskRegisterItem } from './entities';
import { RiskComplianceController } from './risk-compliance.controller';
import { RiskComplianceService } from './risk-compliance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RiskRegisterItem, AuditFinding, DisasterRecoveryPlan]),
    ApplicationsModule,
    StaffModule,
  ],
  controllers: [RiskComplianceController],
  providers: [RiskComplianceService],
  exports: [RiskComplianceService],
})
export class RiskComplianceModule {}
