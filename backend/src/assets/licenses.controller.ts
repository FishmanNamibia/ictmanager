import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../tenant/decorators/tenant-id.decorator';
import { CreateLicenseDto } from './dto/create-license.dto';

@Controller('licenses')
@UseGuards(JwtAuthGuard)
export class LicensesController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateLicenseDto) {
    return this.assetsService.createLicense(tenantId, dto);
  }

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.assetsService.findAllLicenses(tenantId);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.assetsService.findOneLicense(tenantId, id);
  }
}
