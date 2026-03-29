import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './tenant.entity';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { ModuleAccessGuard } from './guards/module-access.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  providers: [TenantService, ModuleAccessGuard],
  controllers: [TenantController],
  exports: [TenantService, ModuleAccessGuard],
})
export class TenantModule {}
