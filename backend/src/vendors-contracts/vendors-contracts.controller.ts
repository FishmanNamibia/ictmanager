import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/roles';
import { TenantId } from '../tenant/decorators/tenant-id.decorator';
import { Vendor, VendorContract } from './entities';
import { VendorsContractsService } from './vendors-contracts.service';

@Controller('vendors-contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorsContractsController {
  constructor(private readonly service: VendorsContractsService) {}

  @Get('vendors')
  listVendors(
    @TenantId() tenantId: string,
    @Query('status') status?: string,
  ): Promise<Vendor[]> {
    return this.service.listVendors(tenantId, status);
  }

  @Get('vendors/:id')
  getVendor(@TenantId() tenantId: string, @Param('id') id: string): Promise<Vendor> {
    return this.service.getVendor(tenantId, id);
  }

  @Post('vendors')
  @Roles(Role.ICT_MANAGER)
  createVendor(@TenantId() tenantId: string, @Body() body: Partial<Vendor>): Promise<Vendor> {
    return this.service.createVendor(tenantId, body);
  }

  @Put('vendors/:id')
  @Roles(Role.ICT_MANAGER)
  updateVendor(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: Partial<Vendor>,
  ): Promise<Vendor> {
    return this.service.updateVendor(tenantId, id, body);
  }

  @Delete('vendors/:id')
  @Roles(Role.ICT_MANAGER)
  deleteVendor(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.service.deleteVendor(tenantId, id);
  }

  @Get('contracts')
  listContracts(
    @TenantId() tenantId: string,
    @Query('status') status?: string,
    @Query('vendorId') vendorId?: string,
  ): Promise<VendorContract[]> {
    return this.service.listContracts(tenantId, status, vendorId);
  }

  @Get('contracts/:id')
  getContract(@TenantId() tenantId: string, @Param('id') id: string): Promise<VendorContract> {
    return this.service.getContract(tenantId, id);
  }

  @Post('contracts')
  @Roles(Role.ICT_MANAGER)
  createContract(@TenantId() tenantId: string, @Body() body: Partial<VendorContract>): Promise<VendorContract> {
    return this.service.createContract(tenantId, body);
  }

  @Put('contracts/:id')
  @Roles(Role.ICT_MANAGER)
  updateContract(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: Partial<VendorContract>,
  ): Promise<VendorContract> {
    return this.service.updateContract(tenantId, id, body);
  }

  @Delete('contracts/:id')
  @Roles(Role.ICT_MANAGER)
  deleteContract(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.service.deleteContract(tenantId, id);
  }

  @Get('dashboard-stats')
  getDashboardStats(@TenantId() tenantId: string) {
    return this.service.getDashboardStats(tenantId);
  }
}

