import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../tenant/decorators/tenant-id.decorator';
import { CreateStaffProfileDto } from './dto/create-staff-profile.dto';
import { UpdateStaffProfileDto } from './dto/update-staff-profile.dto';
import { AddSkillDto } from './dto/add-skill.dto';
import { AddCertificationDto } from './dto/add-certification.dto';
import { AddAssignmentDto } from './dto/add-assignment.dto';

@Controller('staff')
@UseGuards(JwtAuthGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  // ── Profiles ────────────────────────────────────────────────────────────
  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateStaffProfileDto) {
    return this.staffService.createProfile(tenantId, dto);
  }

  @Get('stats')
  getStats(@TenantId() tenantId: string) {
    return this.staffService.getCapacityStats(tenantId);
  }

  @Get()
  findAll(
    @TenantId() tenantId: string,
    @Query('roleType') roleType?: string,
    @Query('location') location?: string,
    @Query('onCall') onCall?: string,
    @Query('workloadStatus') workloadStatus?: string,
    @Query('search') search?: string,
  ) {
    return this.staffService.findAllProfiles(tenantId, {
      roleType, location, workloadStatus, search,
      onCall: onCall === 'true' ? true : undefined,
    });
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
    return this.staffService.removeProfile(tenantId, id);
  }

  // ── Skills ──────────────────────────────────────────────────────────────
  @Post(':id/skills')
  addSkill(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: AddSkillDto) {
    return this.staffService.addSkill(tenantId, id, dto);
  }

  @Get(':id/skills')
  getSkills(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.staffService.getSkillsForProfile(tenantId, id);
  }

  @Delete(':id/skills/:skillId')
  removeSkill(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('skillId') skillId: string,
  ) {
    return this.staffService.removeSkill(tenantId, id, skillId);
  }

  // ── Certifications ──────────────────────────────────────────────────────
  @Post(':id/certifications')
  addCert(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: AddCertificationDto) {
    return this.staffService.addCertification(tenantId, id, dto);
  }

  @Get(':id/certifications')
  getCerts(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.staffService.getCertificationsForProfile(tenantId, id);
  }

  @Delete(':id/certifications/:certId')
  removeCert(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('certId') certId: string,
  ) {
    return this.staffService.removeCertification(tenantId, id, certId);
  }

  // ── System Assignments ──────────────────────────────────────────────────
  @Post(':id/assignments')
  addAssignment(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: AddAssignmentDto) {
    return this.staffService.addAssignment(tenantId, id, dto);
  }

  @Get(':id/assignments')
  getAssignments(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.staffService.getAssignmentsForProfile(tenantId, id);
  }

  @Delete(':id/assignments/:assignId')
  removeAssignment(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('assignId') assignId: string,
  ) {
    return this.staffService.removeAssignment(tenantId, id, assignId);
  }
}
