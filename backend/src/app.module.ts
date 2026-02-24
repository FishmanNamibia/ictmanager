import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { TenantModule } from './tenant/tenant.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AssetsModule } from './assets/assets.module';
import { ApplicationsModule } from './applications/applications.module';
import { StaffModule } from './staff/staff.module';
import { DashboardsModule } from './dashboards/dashboards.module';
import { AuditModule } from './audit/audit.module';
import { PoliciesModule } from './policies/policies.module';
import { LicensesModule } from './licenses/licenses.module';
import { CybersecurityModule } from './cybersecurity/cybersecurity.module';
import { DataGovernanceModule } from './data-governance/data-governance.module';
import { ServiceDeskModule } from './service-desk/service-desk.module';
import { IctProjectsModule } from './ict-projects/ict-projects.module';
import { RiskComplianceModule } from './risk-compliance/risk-compliance.module';
import { VendorsContractsModule } from './vendors-contracts/vendors-contracts.module';
import { ChangeManagementModule } from './change-management/change-management.module';
import { AutomationModule } from './automation/automation.module';
import { getTypeOrmConfig } from './config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: getTypeOrmConfig,
    }),
    ScheduleModule.forRoot(),
    AuditModule,
    TenantModule,
    AuthModule,
    UsersModule,
    AssetsModule,
    ApplicationsModule,
    StaffModule,
    DashboardsModule,
    PoliciesModule,
    LicensesModule,
    CybersecurityModule,
    DataGovernanceModule,
    ServiceDeskModule,
    IctProjectsModule,
    RiskComplianceModule,
    VendorsContractsModule,
    ChangeManagementModule,
    AutomationModule,
  ],
})
export class AppModule {}
