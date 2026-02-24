import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IctProject, ProjectStatus, ProjectPhase, ProjectMilestone } from './entities';

@Injectable()
export class IctProjectsService {
  constructor(
    @InjectRepository(IctProject)
    private readonly projectRepo: Repository<IctProject>,
    @InjectRepository(ProjectMilestone)
    private readonly milestoneRepo: Repository<ProjectMilestone>,
  ) {}

  // Projects
  async createProject(tenantId: string, data: Partial<IctProject>): Promise<IctProject> {
    const project = this.projectRepo.create({ ...data, tenantId });
    return this.projectRepo.save(project);
  }

  async findProjects(tenantId: string, status?: ProjectStatus, phase?: ProjectPhase): Promise<IctProject[]> {
    const where: any = { tenantId };
    if (status) where.status = status;
    if (phase) where.currentPhase = phase;
    return this.projectRepo.find({ where, relations: ['milestones'], order: { createdAt: 'DESC' } });
  }

  async findProject(tenantId: string, id: string): Promise<IctProject> {
    const project = await this.projectRepo.findOne({ where: { id, tenantId }, relations: ['milestones'] });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async updateProject(tenantId: string, id: string, data: Partial<IctProject>): Promise<IctProject> {
    await this.findProject(tenantId, id);
    await this.projectRepo.update({ id, tenantId }, data as any);
    return this.findProject(tenantId, id);
  }

  async deleteProject(tenantId: string, id: string): Promise<void> {
    await this.findProject(tenantId, id);
    await this.projectRepo.delete({ id, tenantId });
  }

  // Milestones
  async addMilestone(tenantId: string, projectId: string, milestoneData: Partial<ProjectMilestone>): Promise<ProjectMilestone> {
    await this.findProject(tenantId, projectId);
    const milestone = this.milestoneRepo.create({ projectId, ...milestoneData });
    return this.milestoneRepo.save(milestone);
  }

  async getMilestones(tenantId: string, projectId: string): Promise<ProjectMilestone[]> {
    await this.findProject(tenantId, projectId);
    return this.milestoneRepo.find({ where: { projectId }, order: { targetDate: 'ASC' } });
  }

  async updateMilestone(tenantId: string, projectId: string, milestoneId: string, data: Partial<ProjectMilestone>): Promise<ProjectMilestone> {
    await this.findProject(tenantId, projectId);
    const milestone = await this.milestoneRepo.findOne({ where: { id: milestoneId, projectId } });
    if (!milestone) throw new NotFoundException('Milestone not found');
    await this.milestoneRepo.update({ id: milestoneId }, data as any);
    const updated = await this.milestoneRepo.findOne({ where: { id: milestoneId } });
    return updated!;
  }

  async deleteMilestone(tenantId: string, projectId: string, milestoneId: string): Promise<void> {
    await this.findProject(tenantId, projectId);
    const milestone = await this.milestoneRepo.findOne({ where: { id: milestoneId, projectId } });
    if (!milestone) throw new NotFoundException('Milestone not found');
    await this.milestoneRepo.delete({ id: milestoneId });
  }

  // Dashboard stats
  async getProjectPortfolioStats(tenantId: string): Promise<{
    totalProjects: number;
    byStatus: Record<string, number>;
    byPhase: Record<string, number>;
    onTrackCount: number;
    atRiskCount: number;
    totalBudget: number;
    spentBudget: number;
    averageCompletion: number;
  }> {
    const projects = await this.projectRepo.find({ where: { tenantId } });

    const byStatus = projects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPhase = projects.reduce((acc, p) => {
      acc[p.currentPhase] = (acc[p.currentPhase] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalBudget = projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
    const onTrack = projects.filter((p) => p.completionPercentage >= 80 && p.status === ProjectStatus.IN_PROGRESS).length;
    const atRisk = projects.filter((p) => p.completionPercentage < 50 && p.status === ProjectStatus.IN_PROGRESS).length;

    let totalCompletion = 0;
    projects.forEach((p) => {
      totalCompletion += p.completionPercentage || 0;
    });
    const avgCompletion = projects.length > 0 ? Math.round(totalCompletion / projects.length) : 0;

    return {
      totalProjects: projects.length,
      byStatus,
      byPhase,
      onTrackCount: onTrack,
      atRiskCount: atRisk,
      totalBudget,
      spentBudget: 0, // would need expense tracking; placeholder for now
      averageCompletion: avgCompletion,
    };
  }
}
