import { Module } from '@nestjs/common';
import { DashboardsService } from './dashboards.service';
import { DashboardsController } from './dashboards.controller';
import { AssetsModule } from '../assets/assets.module';
import { ApplicationsModule } from '../applications/applications.module';
import { StaffModule } from '../staff/staff.module';
import { PoliciesModule } from '../policies/policies.module';

@Module({
  imports: [AssetsModule, ApplicationsModule, StaffModule, PoliciesModule],
  providers: [DashboardsService],
  controllers: [DashboardsController],
})
export class DashboardsModule {}
