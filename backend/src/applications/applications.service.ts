import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, Criticality } from './application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

export type HealthLabel = 'healthy' | 'needs_attention' | 'critical' | 'unknown';

export interface AppWithHealth extends Application {
  healthScore: number;
  healthLabel: HealthLabel;
  daysToContractExpiry: number | null;
  daysToEndOfSupport: number | null;
  contractExpiringSoon: boolean;
  endOfSupportSoon: boolean;
}

function daysBetween(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / 86_400_000);
}

function isoDate(d: Date | null) {
  return d ? new Date(d).toISOString().slice(0, 10) : null;
}

function computeHealth(app: Application): { score: number; label: HealthLabel } {
  // Cannot compute without any health data — return unknown
  const hasData = app.uptimePercent != null || app.openIncidents > 0 || app.openSecurityIssues > 0 || app.backupSuccessRate != null;
  if (!hasData && app.healthStatus === 'unknown') return { score: 0, label: 'unknown' };

  let score = 100;

  // Uptime (30 points)
  if (app.uptimePercent != null) {
    const uptime = Number(app.uptimePercent);
    if (uptime < 95) score -= 30;
    else if (uptime < 99) score -= 15;
    else if (uptime < 99.5) score -= 8;
    else if (uptime < 99.9) score -= 3;
  } else {
    score -= 5;  // minor penalty if no uptime data
  }

  // Open incidents (20 points)
  score -= Math.min(20, app.openIncidents * 5);

  // Security issues (25 points)
  score -= Math.min(25, app.openSecurityIssues * 12);

  // Backup success rate (15 points)
  if (app.backupSuccessRate != null) {
    const br = Number(app.backupSuccessRate);
    if (br < 80) score -= 15;
    else if (br < 90) score -= 8;
    else if (br < 99) score -= 3;
  } else {
    score -= 5;
  }

  // Security review currency (10 points) — must be within 12 months
  if (app.lastSecurityReview) {
    const daysSinceReview = daysBetween(new Date(app.lastSecurityReview), new Date());
    if (daysSinceReview > 365) score -= 10;
    else if (daysSinceReview > 180) score -= 5;
  } else {
    score -= 10;
  }

  // Vulnerability status (bonus deduction)
  if (app.vulnerabilityStatus === 'issues_open') score -= 10;

  score = Math.max(0, Math.min(100, score));

  let label: HealthLabel;
  if (app.healthStatus === 'unknown' && !hasData) label = 'unknown';
  else if (score >= 80) label = 'healthy';
  else if (score >= 50) label = 'needs_attention';
  else label = 'critical';

  return { score, label };
}

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly repo: Repository<Application>,
  ) {}

  private enrich(app: Application): AppWithHealth {
    const { score, label } = computeHealth(app);
    const now = new Date();
    const daysToContractExpiry = app.contractEndDate ? daysBetween(now, new Date(app.contractEndDate)) : null;
    const daysToEndOfSupport = app.endOfSupportDate ? daysBetween(now, new Date(app.endOfSupportDate)) : null;
    return {
      ...app,
      healthScore: score,
      healthLabel: label,
      daysToContractExpiry,
      daysToEndOfSupport,
      contractExpiringSoon: daysToContractExpiry != null && daysToContractExpiry >= 0 && daysToContractExpiry <= 90,
      endOfSupportSoon: daysToEndOfSupport != null && daysToEndOfSupport >= 0 && daysToEndOfSupport <= 180,
    };
  }

  async create(tenantId: string, dto: CreateApplicationDto): Promise<AppWithHealth> {
    const app = this.repo.create({ ...dto, tenantId } as Partial<Application>);
    const saved = await this.repo.save(app);
    return this.enrich(saved);
  }

  async findAll(
    tenantId: string,
    filters?: {
      criticality?: Criticality;
      status?: string;
      hostingType?: string;
      healthLabel?: string;
      search?: string;
    },
  ): Promise<AppWithHealth[]> {
    const qb = this.repo.createQueryBuilder('a').where('a.tenant_id = :tenantId', { tenantId });
    if (filters?.criticality) qb.andWhere('a.criticality = :criticality', { criticality: filters.criticality });
    if (filters?.status) qb.andWhere('a.status = :status', { status: filters.status });
    if (filters?.hostingType) qb.andWhere('a.hosting_type = :hostingType', { hostingType: filters.hostingType });
    let list = (await qb.orderBy('a.name', 'ASC').getMany()).map((a) => this.enrich(a));

    if (filters?.healthLabel) list = list.filter((a) => a.healthLabel === filters!.healthLabel);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((a) =>
        a.name.toLowerCase().includes(q) ||
        (a.acronym ?? '').toLowerCase().includes(q) ||
        (a.businessOwner ?? '').toLowerCase().includes(q) ||
        (a.category ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }

  async findOne(tenantId: string, id: string): Promise<AppWithHealth> {
    const app = await this.repo.findOne({ where: { id, tenantId } });
    if (!app) throw new NotFoundException('Application not found');
    return this.enrich(app);
  }

  async update(tenantId: string, id: string, dto: UpdateApplicationDto): Promise<AppWithHealth> {
    await this.repo.findOne({ where: { id, tenantId } }).then((a) => { if (!a) throw new NotFoundException('Application not found'); });
    await this.repo.update({ id, tenantId }, dto as Partial<Application>);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id);
    await this.repo.delete({ id, tenantId });
  }

  async getPortfolioStats(tenantId: string): Promise<{
    total: number;
    live: number;
    deprecated: number;
    retired: number;
    byCriticality: Record<string, number>;
    byHosting: Record<string, number>;
    byStatus: Record<string, number>;
    byHealth: Record<string, number>;
    tier1Count: number;
    contractsExpiringSoon: number;
    endOfSupportSoon: number;
    criticalHealth: number;
    totalAnnualCost: number;
  }> {
    const list = (await this.repo.find({ where: { tenantId } })).map((a) => this.enrich(a));

    const byCriticality: Record<string, number> = {};
    const byHosting: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byHealth: Record<string, number> = {};
    let contractsExpiringSoon = 0;
    let endOfSupportSoon = 0;
    let criticalHealth = 0;
    let totalAnnualCost = 0;

    list.forEach((a) => {
      byCriticality[a.criticality] = (byCriticality[a.criticality] ?? 0) + 1;
      byHosting[a.hostingType] = (byHosting[a.hostingType] ?? 0) + 1;
      byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
      byHealth[a.healthLabel] = (byHealth[a.healthLabel] ?? 0) + 1;
      if (a.contractExpiringSoon) contractsExpiringSoon++;
      if (a.endOfSupportSoon) endOfSupportSoon++;
      if (a.healthLabel === 'critical') criticalHealth++;
      totalAnnualCost += Number(a.annualMaintenanceCost ?? 0);
    });

    return {
      total: list.length,
      live: byStatus['live'] ?? 0,
      deprecated: byStatus['deprecated'] ?? 0,
      retired: byStatus['retired'] ?? 0,
      byCriticality,
      byHosting,
      byStatus,
      byHealth,
      tier1Count: list.filter((a) => a.tier === 'tier1').length,
      contractsExpiringSoon,
      endOfSupportSoon,
      criticalHealth,
      totalAnnualCost,
    };
  }
}
