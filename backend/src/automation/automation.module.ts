import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChangeManagementModule } from '../change-management/change-management.module';
import { CybersecurityModule } from '../cybersecurity/cybersecurity.module';
import { LicensesModule } from '../licenses/licenses.module';
import { PoliciesModule } from '../policies/policies.module';
import { RiskComplianceModule } from '../risk-compliance/risk-compliance.module';
import { ServiceDeskModule } from '../service-desk/service-desk.module';
import { VendorsContractsModule } from '../vendors-contracts/vendors-contracts.module';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { AutomationLink, AutomationRun } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([AutomationLink, AutomationRun]),
    VendorsContractsModule,
    LicensesModule,
    PoliciesModule,
    CybersecurityModule,
    RiskComplianceModule,
    ServiceDeskModule,
    ChangeManagementModule,
  ],
  controllers: [AutomationController],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
