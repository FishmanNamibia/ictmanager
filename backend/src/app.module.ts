import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantModule } from './tenant/tenant.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AssetsModule } from './assets/assets.module';
import { ApplicationsModule } from './applications/applications.module';
import { StaffModule } from './staff/staff.module';
import { DashboardsModule } from './dashboards/dashboards.module';
import { AuditModule } from './audit/audit.module';
import { getTypeOrmConfig } from './config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: getTypeOrmConfig,
    }),
    AuditModule,
    TenantModule,
    AuthModule,
    UsersModule,
    AssetsModule,
    ApplicationsModule,
    StaffModule,
    DashboardsModule,
  ],
})
export class AppModule {}
