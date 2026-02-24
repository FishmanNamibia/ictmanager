import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditFinding, RiskRegisterItem } from './entities';
import { RiskComplianceController } from './risk-compliance.controller';
import { RiskComplianceService } from './risk-compliance.service';

@Module({
  imports: [TypeOrmModule.forFeature([RiskRegisterItem, AuditFinding])],
  controllers: [RiskComplianceController],
  providers: [RiskComplianceService],
  exports: [RiskComplianceService],
})
export class RiskComplianceModule {}

