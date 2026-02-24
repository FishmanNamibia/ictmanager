import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditFinding, RiskRegisterItem } from './entities';

type DashboardStats = {
  risks: {
    total: number;
    open: number;
    highScore: number;
    overdueReviews: number;
    byDomain: Record<string, number>;
    byStatus: Record<string, number>;
  };
  findings: {
    total: number;
    open: number;
    overdue: number;
    highSeverityOpen: number;
    byStatus: Record<string, number>;
  };
  compliancePosture: {
    overallScore: number;
    atRiskAreas: string[];
  };
};

@Injectable()
export class RiskComplianceService {
  constructor(
    @InjectRepository(RiskRegisterItem)
    private readonly riskRepo: Repository<RiskRegisterItem>,
    @InjectRepository(AuditFinding)
    private readonly findingRepo: Repository<AuditFinding>,
  ) {}

  private normalizedScore(likelihood?: number, impact?: number): number {
    const l = Number.isFinite(likelihood) ? Math.max(1, Math.min(5, Number(likelihood))) : 3;
    const i = Number.isFinite(impact) ? Math.max(1, Math.min(5, Number(impact))) : 3;
    return l * i;
  }

  private async nextFindingRef(tenantId: string): Promise<string> {
    const total = await this.findingRepo.count({ where: { tenantId } });
    return `AF-${String(total + 1).padStart(4, '0')}`;
  }

  async listRisks(tenantId: string, status?: string, domain?: string): Promise<RiskRegisterItem[]> {
    const where: { tenantId: string; status?: string; domain?: string } = { tenantId };
    if (status) where.status = status;
    if (domain) where.domain = domain;
    return this.riskRepo.find({ where, order: { riskScore: 'DESC', createdAt: 'DESC' } });
  }

  async getRisk(tenantId: string, id: string): Promise<RiskRegisterItem> {
    const risk = await this.riskRepo.findOne({ where: { id, tenantId } });
    if (!risk) throw new NotFoundException('Risk item not found');
    return risk;
  }

  async createRisk(tenantId: string, data: Partial<RiskRegisterItem>): Promise<RiskRegisterItem> {
    const likelihood = Number(data.likelihood ?? 3);
    const impact = Number(data.impact ?? 3);
    const riskScore = this.normalizedScore(likelihood, impact);
    const entity = this.riskRepo.create({
      ...data,
      tenantId,
      likelihood,
      impact,
      riskScore: Number(data.riskScore) || riskScore,
      domain: data.domain || 'operations',
      status: data.status || 'open',
    });
    return this.riskRepo.save(entity);
  }

  async updateRisk(tenantId: string, id: string, data: Partial<RiskRegisterItem>): Promise<RiskRegisterItem> {
    const current = await this.getRisk(tenantId, id);
    const likelihood = Number(data.likelihood ?? current.likelihood ?? 3);
    const impact = Number(data.impact ?? current.impact ?? 3);
    const riskScore = this.normalizedScore(likelihood, impact);

    await this.riskRepo.update(
      { id, tenantId },
      {
        ...data,
        likelihood,
        impact,
        riskScore: Number(data.riskScore) || riskScore,
      } as any,
    );
    return this.getRisk(tenantId, id);
  }

  async deleteRisk(tenantId: string, id: string): Promise<void> {
    await this.getRisk(tenantId, id);
    await this.riskRepo.delete({ id, tenantId });
  }

  async listFindings(tenantId: string, status?: string, severity?: string): Promise<AuditFinding[]> {
    const where: { tenantId: string; status?: string; severity?: string } = { tenantId };
    if (status) where.status = status;
    if (severity) where.severity = severity;
    return this.findingRepo.find({ where, order: { dueDate: 'ASC', createdAt: 'DESC' } });
  }

  async getFinding(tenantId: string, id: string): Promise<AuditFinding> {
    const finding = await this.findingRepo.findOne({ where: { id, tenantId } });
    if (!finding) throw new NotFoundException('Audit finding not found');
    return finding;
  }

  async createFinding(tenantId: string, data: Partial<AuditFinding>): Promise<AuditFinding> {
    const findingRef = data.findingRef?.trim() || await this.nextFindingRef(tenantId);
    const entity = this.findingRepo.create({
      ...data,
      tenantId,
      findingRef,
      severity: data.severity || 'medium',
      status: data.status || 'open',
    });
    return this.findingRepo.save(entity);
  }

  async updateFinding(tenantId: string, id: string, data: Partial<AuditFinding>): Promise<AuditFinding> {
    await this.getFinding(tenantId, id);
    await this.findingRepo.update({ id, tenantId }, data as any);
    return this.getFinding(tenantId, id);
  }

  async deleteFinding(tenantId: string, id: string): Promise<void> {
    await this.getFinding(tenantId, id);
    await this.findingRepo.delete({ id, tenantId });
  }

  async getDashboardStats(tenantId: string): Promise<DashboardStats> {
    const [risks, findings] = await Promise.all([
      this.listRisks(tenantId),
      this.listFindings(tenantId),
    ]);

    const now = new Date();
    const risksByDomain = risks.reduce((acc, risk) => {
      acc[risk.domain] = (acc[risk.domain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const risksByStatus = risks.reduce((acc, risk) => {
      acc[risk.status] = (acc[risk.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const findingsByStatus = findings.reduce((acc, finding) => {
      acc[finding.status] = (acc[finding.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const openRisks = risks.filter((risk) => !['closed', 'accepted'].includes(risk.status)).length;
    const highScore = risks.filter((risk) => Number(risk.riskScore) >= 16).length;
    const overdueReviews = risks.filter((risk) => risk.nextReviewDate && new Date(risk.nextReviewDate) < now).length;
    const openFindings = findings.filter((finding) => finding.status !== 'closed').length;
    const overdueFindings = findings.filter((finding) => finding.status !== 'closed' && finding.dueDate && new Date(finding.dueDate) < now).length;
    const highSeverityOpen = findings.filter((finding) => finding.status !== 'closed' && ['high', 'critical'].includes(finding.severity)).length;

    // A lightweight aggregate score to quickly surface posture drift.
    const penalty = (highScore * 5) + (overdueFindings * 6) + (highSeverityOpen * 4) + (overdueReviews * 3);
    const overallScore = Math.max(0, 100 - Math.min(95, penalty));

    const atRiskAreas = Object.entries(risksByDomain)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([domain]) => domain);

    return {
      risks: {
        total: risks.length,
        open: openRisks,
        highScore,
        overdueReviews,
        byDomain: risksByDomain,
        byStatus: risksByStatus,
      },
      findings: {
        total: findings.length,
        open: openFindings,
        overdue: overdueFindings,
        highSeverityOpen,
        byStatus: findingsByStatus,
      },
      compliancePosture: {
        overallScore,
        atRiskAreas,
      },
    };
  }
}
