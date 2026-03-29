import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../common/roles';
import { UpdateTenantSettingsDto } from './dto/update-tenant-settings.dto';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('branding/default')
  getDefaultBranding() {
    return this.tenantService.getDefaultPublicBranding();
  }

  @Get('branding/by-slug/:slug')
  getBrandingBySlug(@Param('slug') slug: string) {
    return this.tenantService.getPublicBrandingBySlug(slug);
  }

  @Get('by-slug/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.tenantService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get('settings/current')
  getCurrentSettings(@CurrentUser() user: { tenantId: string }) {
    return this.tenantService.getExperienceSettings(user.tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER)
  @Put('settings/current')
  updateCurrentSettings(
    @CurrentUser() user: { tenantId: string },
    @Body() dto: UpdateTenantSettingsDto,
  ) {
    return this.tenantService.updateExperienceSettings(user.tenantId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.tenantService.findById(id);
  }
}
