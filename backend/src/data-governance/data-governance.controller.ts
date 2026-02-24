import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DataGovernanceService } from './data-governance.service';
import { DataAsset, DataProcessingRecord, DataQualityMetric } from './entities';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../tenant/decorators/tenant-id.decorator';
import { Role } from '../common/roles';

@Controller('data-governance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DataGovernanceController {
  constructor(private readonly service: DataGovernanceService) {}

  // Data Assets
  @Get('assets')
  async getAssets(@TenantId() tenantId: string): Promise<DataAsset[]> {
    return this.service.findAssets(tenantId);
  }

  @Get('assets/:id')
  async getAsset(@TenantId() tenantId: string, @Param('id') id: string): Promise<DataAsset> {
    return this.service.findAsset(tenantId, id);
  }

  @Post('assets')
  @Roles(Role.ICT_MANAGER)
  async createAsset(@TenantId() tenantId: string, @Body() data: Partial<DataAsset>): Promise<DataAsset> {
    return this.service.createAsset(tenantId, data);
  }

  @Put('assets/:id')
  @Roles(Role.ICT_MANAGER)
  async updateAsset(@TenantId() tenantId: string, @Param('id') id: string, @Body() data: Partial<DataAsset>): Promise<DataAsset> {
    return this.service.updateAsset(tenantId, id, data);
  }

  @Delete('assets/:id')
  @Roles(Role.ICT_MANAGER)
  async deleteAsset(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.service.deleteAsset(tenantId, id);
  }

  // Processing Records
  @Get('processing-records')
  async getProcessingRecords(@TenantId() tenantId: string): Promise<DataProcessingRecord[]> {
    return this.service.findProcessingRecords(tenantId);
  }

  @Get('processing-records/:id')
  async getProcessingRecord(@TenantId() tenantId: string, @Param('id') id: string): Promise<DataProcessingRecord> {
    return this.service.findProcessingRecord(tenantId, id);
  }

  @Post('processing-records')
  @Roles(Role.ICT_MANAGER)
  async createProcessingRecord(@TenantId() tenantId: string, @Body() data: Partial<DataProcessingRecord>): Promise<DataProcessingRecord> {
    return this.service.createProcessingRecord(tenantId, data);
  }

  @Put('processing-records/:id')
  @Roles(Role.ICT_MANAGER)
  async updateProcessingRecord(@TenantId() tenantId: string, @Param('id') id: string, @Body() data: Partial<DataProcessingRecord>): Promise<DataProcessingRecord> {
    return this.service.updateProcessingRecord(tenantId, id, data);
  }

  @Delete('processing-records/:id')
  @Roles(Role.ICT_MANAGER)
  async deleteProcessingRecord(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.service.deleteProcessingRecord(tenantId, id);
  }

  // Quality Metrics
  @Get('quality-metrics')
  async getQualityMetrics(@TenantId() tenantId: string): Promise<DataQualityMetric[]> {
    return this.service.findQualityMetrics(tenantId);
  }

  @Get('quality-metrics/:id')
  async getQualityMetric(@TenantId() tenantId: string, @Param('id') id: string): Promise<DataQualityMetric> {
    return this.service.findQualityMetric(tenantId, id);
  }

  @Post('quality-metrics')
  @Roles(Role.ICT_MANAGER)
  async createQualityMetric(@TenantId() tenantId: string, @Body() data: Partial<DataQualityMetric>): Promise<DataQualityMetric> {
    return this.service.createQualityMetric(tenantId, data);
  }

  @Put('quality-metrics/:id')
  @Roles(Role.ICT_MANAGER)
  async updateQualityMetric(@TenantId() tenantId: string, @Param('id') id: string, @Body() data: Partial<DataQualityMetric>): Promise<DataQualityMetric> {
    return this.service.updateQualityMetric(tenantId, id, data);
  }

  @Delete('quality-metrics/:id')
  @Roles(Role.ICT_MANAGER)
  async deleteQualityMetric(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.service.deleteQualityMetric(tenantId, id);
  }

  // Dashboard stats
  @Get('dashboard-stats')
  async getGovernanceStats(@TenantId() tenantId: string): Promise<any> {
    return this.service.getGovernanceStats(tenantId);
  }
}
