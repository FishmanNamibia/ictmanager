import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChangeRequest, ReleaseRecord } from './entities';

type DashboardStats = {
  changes: {
    total: number;
    open: number;
    pendingApprovals: number;
    highRisk: number;
    scheduledThisMonth: number;
    successRatePercent: number;
  };
  releases: {
    total: number;
    planned: number;
    completed: number;
    failedOrRolledBack: number;
    thisMonth: number;
  };
};

@Injectable()
export class ChangeManagementService {
  constructor(
    @InjectRepository(ChangeRequest)
    private readonly changeRepo: Repository<ChangeRequest>,
    @InjectRepository(ReleaseRecord)
    private readonly releaseRepo: Repository<ReleaseRecord>,
  ) {}

  private async nextChangeNumber(tenantId: string): Promise<string> {
    const total = await this.changeRepo.count({ where: { tenantId } });
    return `CHG-${String(total + 1).padStart(5, '0')}`;
  }

  private async nextReleaseNumber(tenantId: string): Promise<string> {
    const total = await this.releaseRepo.count({ where: { tenantId } });
    return `REL-${String(total + 1).padStart(5, '0')}`;
  }

  async listChanges(tenantId: string, status?: string, riskLevel?: string): Promise<ChangeRequest[]> {
    const where: { tenantId: string; status?: string; riskLevel?: string } = { tenantId };
    if (status) where.status = status;
    if (riskLevel) where.riskLevel = riskLevel;
    return this.changeRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async getChange(tenantId: string, id: string): Promise<ChangeRequest> {
    const change = await this.changeRepo.findOne({ where: { id, tenantId } });
    if (!change) throw new NotFoundException('Change request not found');
    return change;
  }

  async createChange(tenantId: string, data: Partial<ChangeRequest>): Promise<ChangeRequest> {
    const changeNumber = data.changeNumber?.trim() || await this.nextChangeNumber(tenantId);
    const requestedBy = data.requestedBy?.trim() || 'unknown@local';
    const change = this.changeRepo.create({
      ...data,
      tenantId,
      changeNumber,
      requestedBy,
      status: data.status || 'requested',
      riskLevel: data.riskLevel || 'medium',
      impactLevel: data.impactLevel || 'medium',
      outageExpected: Boolean(data.outageExpected ?? false),
      businessApproval: Boolean(data.businessApproval ?? false),
    });
    return this.changeRepo.save(change);
  }

  async updateChange(tenantId: string, id: string, data: Partial<ChangeRequest>): Promise<ChangeRequest> {
    await this.getChange(tenantId, id);
    await this.changeRepo.update({ id, tenantId }, data as any);
    return this.getChange(tenantId, id);
  }

  async deleteChange(tenantId: string, id: string): Promise<void> {
    await this.getChange(tenantId, id);
    await this.changeRepo.delete({ id, tenantId });
  }

  async listReleases(tenantId: string, status?: string): Promise<ReleaseRecord[]> {
    const where: { tenantId: string; status?: string } = { tenantId };
    if (status) where.status = status;
    return this.releaseRepo.find({ where, relations: ['changeRequest'], order: { plannedDate: 'DESC', createdAt: 'DESC' } });
  }

  async getRelease(tenantId: string, id: string): Promise<ReleaseRecord> {
    const release = await this.releaseRepo.findOne({ where: { id, tenantId }, relations: ['changeRequest'] });
    if (!release) throw new NotFoundException('Release record not found');
    return release;
  }

  async createRelease(tenantId: string, data: Partial<ReleaseRecord>): Promise<ReleaseRecord> {
    if (data.changeRequestId) {
      await this.getChange(tenantId, data.changeRequestId);
    }
    const releaseNumber = data.releaseNumber?.trim() || await this.nextReleaseNumber(tenantId);
    const release = this.releaseRepo.create({
      ...data,
      tenantId,
      releaseNumber,
      status: data.status || 'planned',
      environment: data.environment || 'production',
    });
    return this.releaseRepo.save(release);
  }

  async updateRelease(tenantId: string, id: string, data: Partial<ReleaseRecord>): Promise<ReleaseRecord> {
    await this.getRelease(tenantId, id);
    if (data.changeRequestId) {
      await this.getChange(tenantId, data.changeRequestId);
    }
    await this.releaseRepo.update({ id, tenantId }, data as any);
    return this.getRelease(tenantId, id);
  }

  async deleteRelease(tenantId: string, id: string): Promise<void> {
    await this.getRelease(tenantId, id);
    await this.releaseRepo.delete({ id, tenantId });
  }

  async getDashboardStats(tenantId: string): Promise<DashboardStats> {
    const [changes, releases] = await Promise.all([
      this.listChanges(tenantId),
      this.listReleases(tenantId),
    ]);

    const openChanges = changes.filter((change) => !['closed', 'rejected'].includes(change.status)).length;
    const pendingApprovals = changes.filter((change) => ['requested', 'assessment'].includes(change.status)).length;
    const highRisk = changes.filter((change) => ['high', 'critical'].includes(change.riskLevel)).length;
    const successfulChanges = changes.filter((change) => ['implemented', 'closed'].includes(change.status)).length;
    const changeSuccessRatePercent = changes.length ? Math.round((successfulChanges / changes.length) * 100) : 100;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const scheduledThisMonth = changes.filter((change) => {
      if (!change.plannedStart) return false;
      const planned = new Date(change.plannedStart);
      return planned >= monthStart && planned <= monthEnd;
    }).length;

    const releasesThisMonth = releases.filter((release) => {
      const marker = release.releaseDate ? new Date(release.releaseDate) : (release.plannedDate ? new Date(release.plannedDate) : null);
      return marker ? marker >= monthStart && marker <= monthEnd : false;
    }).length;

    return {
      changes: {
        total: changes.length,
        open: openChanges,
        pendingApprovals,
        highRisk,
        scheduledThisMonth,
        successRatePercent: changeSuccessRatePercent,
      },
      releases: {
        total: releases.length,
        planned: releases.filter((release) => release.status === 'planned').length,
        completed: releases.filter((release) => release.status === 'completed').length,
        failedOrRolledBack: releases.filter((release) => ['failed', 'rolled_back'].includes(release.status)).length,
        thisMonth: releasesThisMonth,
      },
    };
  }
}
