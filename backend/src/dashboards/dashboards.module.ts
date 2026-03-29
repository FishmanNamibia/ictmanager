import { Module } from '@nestjs/common';
import { DashboardsService } from './dashboards.service';
import { DashboardsController } from './dashboards.controller';
import { AssetsModule } from '../assets/assets.module';
import { ApplicationsModule } from '../applications/applications.module';
import { StaffModule } from '../staff/staff.module';
import { PoliciesModule } from '../policies/policies.module';
import { CybersecurityModule } from '../cybersecurity/cybersecurity.module';
import { ServiceDeskModule } from '../service-desk/service-desk.module';
import { DataGovernanceModule } from '../data-governance/data-governance.module';
import { RiskComplianceModule } from '../risk-compliance/risk-compliance.module';
import { ChangeManagementModule } from '../change-management/change-management.module';
import { VendorsContractsModule } from '../vendors-contracts/vendors-contracts.module';

@Module({
  imports: [
    AssetsModule,
    ApplicationsModule,
    StaffModule,
    PoliciesModule,
    CybersecurityModule,
    ServiceDeskModule,
    DataGovernanceModule,
    RiskComplianceModule,
    ChangeManagementModule,
    VendorsContractsModule,
  ],
  providers: [DashboardsService],
  controllers: [DashboardsController],
})
export class DashboardsModule {}
