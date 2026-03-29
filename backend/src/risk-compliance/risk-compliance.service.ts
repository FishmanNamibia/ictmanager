import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationsService } from '../applications/applications.service';
import { StaffService } from '../staff/staff.service';
import { AppWithHealth } from '../applications/applications.service';
import { SystemAssignment } from '../staff/system-assignment.entity';
import { AuditFinding, DisasterRecoveryPlan, RiskRegisterItem } from './entities';

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

type DrInsightSeverity = 'low' | 'medium' | 'high';

export type DisasterRecoveryInsight = {
  applicationId: string;
  applicationName: string;
  severity: DrInsightSeverity;
  status: 'attention_needed' | 'covered';
  issues: string[];
  owner: string | null;
  planId: string | null;
  planStatus: string | null;
  failoverType: string | null;
  dependencyCount: number;
  backupAssignmentCount: number;
};

export type DisasterRecoveryOverview = {
  summary: {
    totalPlans: number;
    activePlans: number;
    automatedFailoverPlans: number;
    plansNeedingReview: number;
    uncoveredCriticalApps: number;
  };
  items: DisasterRecoveryInsight[];
};

@Injectable()
export class RiskComplianceService {
  constructor(
    @InjectRepository(RiskRegisterItem)
    private readonly riskRepo: Repository<RiskRegisterItem>,
    @InjectRepository(AuditFinding)
    private readonly findingRepo: Repository<AuditFinding>,
    @InjectRepository(DisasterRecoveryPlan)
    private readonly drPlanRepo: Repository<DisasterRecoveryPlan>,
    private readonly applicationsService: ApplicationsService,
    private readonly staffService: StaffService,
  ) {}

  private splitList(value?: string | null): string[] {
    if (!value) return [];
    return value
      .split(/[,\n]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  private isDueOrMissing(value?: Date | null): boolean {
    if (!value) return true;
    return new Date(value) < new Date();
  }

  private issueSeverity(app: AppWithHealth, issues: string[]): DrInsightSeverity {
    if (!issues.length) return 'low';
    if (
      app.criticality === 'critical' ||
      app.tier === 'tier1' ||
      issues.some((issue) => issue.includes('No disaster recovery plan') || issue.includes('No recovery site'))
    ) {
      return 'high';
    }
    return app.criticality === 'high' || issues.length >= 3 ? 'medium' : 'low';
  }

  private buildDrInsight(
    app: AppWithHealth,
    plan: DisasterRecoveryPlan | null,
    assignments: SystemAssignment[],
  ): DisasterRecoveryInsight {
    const dependencyItems = this.splitList(app.dependencies);
    const integrationItems = this.splitList(app.integrations);
    const dependencyCount = dependencyItems.length + integrationItems.length;
    const backupAssignmentCount = assignments.filter((assignment) => assignment.role === 'backup').length;
    const issues: string[] = [];

    if (!plan) {
      issues.push('No disaster recovery plan recorded');
    }
    if (!plan?.recoverySite?.trim()) {
      issues.push('No recovery site defined');
    }
    if (!plan?.runbookUrl?.trim()) {
      issues.push('No recovery runbook linked');
    }
    if (this.isDueOrMissing(plan?.nextDrTestDate)) {
      issues.push(plan?.lastDrTestDate ? 'Recovery drill is overdue' : 'Recovery drill has never been tested');
    }
    if (this.isDueOrMissing(plan?.nextBackupVerificationDate)) {
      issues.push(plan?.lastBackupVerificationDate ? 'Backup verification is overdue' : 'Backup verification has never been recorded');
    }
    if (backupAssignmentCount === 0) {
      issues.push('No backup assignee is mapped for this system');
    }
    if ((app.backupSuccessRate ?? null) != null && Number(app.backupSuccessRate) < 95) {
      issues.push(`Backup success rate is ${Number(app.backupSuccessRate).toFixed(1)}%`);
    }
    if (dependencyCount > 0 && (!plan || plan.failoverType === 'manual')) {
      issues.push('Integrated dependencies still rely on manual recovery handoff');
    }
    if (!app.rto?.trim() || !app.rpo?.trim()) {
      issues.push('RTO/RPO targets are incomplete on the application record');
    }

    return {
      applicationId: app.id,
      applicationName: app.name,
      severity: this.issueSeverity(app, issues),
      status: issues.length ? 'attention_needed' : 'covered',
      issues,
      owner: app.ictOwner || app.systemOwner || null,
      planId: plan?.id ?? null,
      planStatus: plan?.status ?? null,
      failoverType: plan?.failoverType ?? null,
      dependencyCount,
      backupAssignmentCount,
    };
  }

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

  async listDisasterRecoveryPlans(tenantId: string): Promise<DisasterRecoveryPlan[]> {
    return this.drPlanRepo.find({
      where: { tenantId },
      order: { updatedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async getDisasterRecoveryPlan(tenantId: string, id: string): Promise<DisasterRecoveryPlan> {
    const plan = await this.drPlanRepo.findOne({ where: { id, tenantId } });
    if (!plan) throw new NotFoundException('Disaster recovery plan not found');
    return plan;
  }

  async createDisasterRecoveryPlan(
    tenantId: string,
    data: Partial<DisasterRecoveryPlan>,
  ): Promise<DisasterRecoveryPlan> {
    const entity = this.drPlanRepo.create({
      ...data,
      tenantId,
      status: data.status || 'draft',
      recoveryTier: data.recoveryTier || 'warm',
      failoverType: data.failoverType || 'manual',
    });
    return this.drPlanRepo.save(entity);
  }

  async updateDisasterRecoveryPlan(
    tenantId: string,
    id: string,
    data: Partial<DisasterRecoveryPlan>,
  ): Promise<DisasterRecoveryPlan> {
    await this.getDisasterRecoveryPlan(tenantId, id);
    await this.drPlanRepo.update({ id, tenantId }, data as any);
    return this.getDisasterRecoveryPlan(tenantId, id);
  }

  async deleteDisasterRecoveryPlan(tenantId: string, id: string): Promise<void> {
    await this.getDisasterRecoveryPlan(tenantId, id);
    await this.drPlanRepo.delete({ id, tenantId });
  }

  async getDisasterRecoveryOverview(tenantId: string): Promise<DisasterRecoveryOverview> {
    const [plans, apps, assignments] = await Promise.all([
      this.listDisasterRecoveryPlans(tenantId),
      this.applicationsService.findAll(tenantId),
      this.staffService.findAssignments(tenantId),
    ]);

    const scopedApps = apps.filter((app) => app.status === 'live' && ['critical', 'high'].includes(app.criticality));
    const plansByApplicationId = new Map(
      plans
        .filter((plan) => plan.applicationId)
        .map((plan) => [plan.applicationId as string, plan]),
    );
    const assignmentsBySystem = assignments.reduce((acc, assignment) => {
      const key = assignment.systemId || assignment.systemName;
      if (!acc[key]) acc[key] = [];
      acc[key].push(assignment);
      return acc;
    }, {} as Record<string, SystemAssignment[]>);

    const items = scopedApps
      .map((app) => this.buildDrInsight(
        app,
        plansByApplicationId.get(app.id) ?? null,
        assignmentsBySystem[app.id] || assignmentsBySystem[app.name] || [],
      ))
      .sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.severity] - order[b.severity] || a.applicationName.localeCompare(b.applicationName);
      });

    return {
      summary: {
        totalPlans: plans.length,
        activePlans: plans.filter((plan) => plan.status === 'active').length,
        automatedFailoverPlans: plans.filter((plan) => ['automated', 'semi_automated'].includes(plan.failoverType)).length,
        plansNeedingReview: plans.filter(
          (plan) => plan.status === 'needs_review' || this.isDueOrMissing(plan.nextDrTestDate) || this.isDueOrMissing(plan.nextBackupVerificationDate),
        ).length,
        uncoveredCriticalApps: items.filter((item) => item.status === 'attention_needed').length,
      },
      items,
    };
  }

  async getDashboardStats(tenantId: string): Promise<DashboardStats> {
    const [risks, findings, drOverview] = await Promise.all([
      this.listRisks(tenantId),
      this.listFindings(tenantId),
      this.getDisasterRecoveryOverview(tenantId),
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
    const penalty =
      (highScore * 5) +
      (overdueFindings * 6) +
      (highSeverityOpen * 4) +
      (overdueReviews * 3) +
      (drOverview.summary.uncoveredCriticalApps * 4);
    const overallScore = Math.max(0, 100 - Math.min(95, penalty));

    const atRiskAreas = Object.entries({
      ...risksByDomain,
      business_continuity: drOverview.summary.uncoveredCriticalApps,
    })
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
