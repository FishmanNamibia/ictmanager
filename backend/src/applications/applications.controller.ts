import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../tenant/decorators/tenant-id.decorator';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { Criticality } from './application.entity';

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly svc: ApplicationsService) {}

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateApplicationDto) {
    return this.svc.create(tenantId, dto);
  }

  @Get('stats')
  getStats(@TenantId() tenantId: string) {
    return this.svc.getPortfolioStats(tenantId);
  }

  @Get()
  findAll(
    @TenantId() tenantId: string,
    @Query('criticality') criticality?: Criticality,
    @Query('status') status?: string,
    @Query('hostingType') hostingType?: string,
    @Query('healthLabel') healthLabel?: string,
    @Query('search') search?: string,
  ) {
    return this.svc.findAll(tenantId, { criticality, status, hostingType, healthLabel, search });
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.svc.findOne(tenantId, id);
  }

  @Put(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.svc.update(tenantId, id, dto);
  }

  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.svc.remove(tenantId, id);
  }
}
