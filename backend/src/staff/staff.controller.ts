import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../tenant/decorators/tenant-id.decorator';
import { CreateStaffProfileDto } from './dto/create-staff-profile.dto';
import { UpdateStaffProfileDto } from './dto/update-staff-profile.dto';

@Controller('staff')
@UseGuards(JwtAuthGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateStaffProfileDto) {
    return this.staffService.createProfile(tenantId, dto);
  }

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.staffService.findAllProfiles(tenantId);
  }

  @Get('stats')
  getStats(@TenantId() tenantId: string) {
    return this.staffService.getSkillsGapStats(tenantId);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.staffService.findOneProfile(tenantId, id);
  }

  @Put(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateStaffProfileDto) {
    return this.staffService.updateProfile(tenantId, id, dto);
  }

  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    // Optional: soft delete or restrict
    return this.staffService.updateProfile(tenantId, id, { notes: '(archived)' });
  }
}
