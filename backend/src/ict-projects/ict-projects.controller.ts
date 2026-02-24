import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { IctProjectsService } from './ict-projects.service';
import { IctProject, ProjectStatus, ProjectPhase, ProjectMilestone } from './entities';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../tenant/decorators/tenant-id.decorator';
import { Role } from '../common/roles';

@Controller('ict-projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IctProjectsController {
  constructor(private readonly service: IctProjectsService) {}

  // Projects
  @Get('projects')
  async getProjects(
    @TenantId() tenantId: string,
    @Query('status') status?: ProjectStatus,
    @Query('phase') phase?: ProjectPhase,
  ): Promise<IctProject[]> {
    return this.service.findProjects(tenantId, status, phase);
  }

  @Get('projects/:id')
  async getProject(@TenantId() tenantId: string, @Param('id') id: string): Promise<IctProject> {
    return this.service.findProject(tenantId, id);
  }

  @Post('projects')
  @Roles(Role.ICT_MANAGER)
  async createProject(@TenantId() tenantId: string, @Body() data: Partial<IctProject>): Promise<IctProject> {
    return this.service.createProject(tenantId, data);
  }

  @Put('projects/:id')
  @Roles(Role.ICT_MANAGER)
  async updateProject(@TenantId() tenantId: string, @Param('id') id: string, @Body() data: Partial<IctProject>): Promise<IctProject> {
    return this.service.updateProject(tenantId, id, data);
  }

  @Delete('projects/:id')
  @Roles(Role.ICT_MANAGER)
  async deleteProject(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.service.deleteProject(tenantId, id);
  }

  // Milestones
  @Get('projects/:projectId/milestones')
  async getMilestones(@TenantId() tenantId: string, @Param('projectId') projectId: string): Promise<ProjectMilestone[]> {
    return this.service.getMilestones(tenantId, projectId);
  }

  @Post('projects/:projectId/milestones')
  @Roles(Role.ICT_MANAGER)
  async addMilestone(
    @TenantId() tenantId: string,
    @Param('projectId') projectId: string,
    @Body() data: Partial<ProjectMilestone>,
  ): Promise<ProjectMilestone> {
    return this.service.addMilestone(tenantId, projectId, data);
  }

  @Put('projects/:projectId/milestones/:milestoneId')
  @Roles(Role.ICT_MANAGER)
  async updateMilestone(
    @TenantId() tenantId: string,
    @Param('projectId') projectId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() data: Partial<ProjectMilestone>,
  ): Promise<ProjectMilestone> {
    return this.service.updateMilestone(tenantId, projectId, milestoneId, data);
  }

  @Delete('projects/:projectId/milestones/:milestoneId')
  @Roles(Role.ICT_MANAGER)
  async deleteMilestone(
    @TenantId() tenantId: string,
    @Param('projectId') projectId: string,
    @Param('milestoneId') milestoneId: string,
  ): Promise<void> {
    return this.service.deleteMilestone(tenantId, projectId, milestoneId);
  }

  // Dashboard stats
  @Get('dashboard-stats')
  async getPortfolioStats(@TenantId() tenantId: string): Promise<any> {
    return this.service.getProjectPortfolioStats(tenantId);
  }
}
