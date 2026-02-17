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
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(tenantId, dto);
  }

  @Get()
  findAll(
    @TenantId() tenantId: string,
    @Query('criticality') criticality?: Criticality,
    @Query('healthStatus') healthStatus?: string,
  ) {
    return this.applicationsService.findAll(tenantId, { criticality, healthStatus });
  }

  @Get('stats')
  getStats(@TenantId() tenantId: string) {
    return this.applicationsService.getPortfolioStats(tenantId);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.applicationsService.findOne(tenantId, id);
  }

  @Put(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.applicationsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.applicationsService.remove(tenantId, id);
  }
}
