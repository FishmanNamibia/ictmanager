import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../tenant/decorators/tenant-id.decorator';
import { AddSkillDto } from './dto/add-skill.dto';

@Controller('staff/:staffProfileId/skills')
@UseGuards(JwtAuthGuard)
export class SkillsController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  add(@TenantId() tenantId: string, @Param('staffProfileId') staffProfileId: string, @Body() dto: AddSkillDto) {
    return this.staffService.addSkill(tenantId, staffProfileId, dto);
  }

  @Get()
  list(@TenantId() tenantId: string, @Param('staffProfileId') staffProfileId: string) {
    return this.staffService.getSkillsForProfile(tenantId, staffProfileId);
  }

  @Delete(':skillId')
  remove(
    @TenantId() tenantId: string,
    @Param('staffProfileId') staffProfileId: string,
    @Param('skillId') skillId: string,
  ) {
    return this.staffService.removeSkill(tenantId, staffProfileId, skillId);
  }
}
