import { Injectable, Logger } from '@nestjs/common';
import { AssetsService } from '../assets/assets.service';
import { ApplicationsService } from '../applications/applications.service';
import { StaffService } from '../staff/staff.service';
import { PoliciesService } from '../policies/policies.service';

@Injectable()
export class DashboardsService {
  private readonly logger = new Logger(DashboardsService.name);

  constructor(
    private readonly assetsService: AssetsService,
    private readonly applicationsService: ApplicationsService,
    private readonly staffService: StaffService,
    private readonly policiesService: PoliciesService,
  ) {}

  private async safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      this.logger.warn(`${label} widget failed: ${(e as Error)?.message ?? 'unknown error'}`);
      return fallback;
    }
  }

  async getIctManagerDashboard(tenantId: string) {
    const [assetStats, licenseCompliance, appStats, staffStats] = await Promise.all([
      this.safe('assets', () => this.assetsService.getAssetStats(tenantId), { total: 0, byStatus: {}, byType: {} }),
      this.safe('licenses', () => this.assetsService.getLicenseCompliance(tenantId), {
        total: 0,
        expiringSoon: 0,
        overAllocated: 0,
        expiringIn30: 0,
        expiringIn60: 0,
        expiringIn90: 0,
        renewalsThisQuarter: 0,
        complianceRiskScore: 100,
        expiringIn30Days: [],
        overAllocatedList: [],
        renewalsDueThisQuarter: [],
      }),
      this.safe('applications', () => this.applicationsService.getPortfolioStats(tenantId), {
        total: 0,
        live: 0,
        deprecated: 0,
        retired: 0,
        byCriticality: {},
        byHosting: {},
        byStatus: {},
        byHealth: {},
        tier1Count: 0,
        contractsExpiringSoon: 0,
        endOfSupportSoon: 0,
        criticalHealth: 0,
        totalAnnualCost: 0,
      }),
      this.safe('staff', () => this.staffService.getSkillsGapStats(tenantId), {
        total: 0,
        onCallCount: 0,
        avgCapacity: 0,
        overloaded: 0,
        highLoad: 0,
        underUtilised: 0,
        certsExpiring30: 0,
        certsExpiring60: 0,
        singlePointRisk: [],
        topSkillGaps: [],
        byRole: {},
        byEmployment: {},
      }),
    ]);

    let governance: {
      total: number;
      overdueForReview: number;
      approved: number;
      draft: number;
      expired: number;
      overduePolicies: Array<{ id: string; title: string; nextReviewDue: string }>;
    } = {
      total: 0,
      overdueForReview: 0,
      approved: 0,
      draft: 0,
      expired: 0,
      overduePolicies: [],
    };
    try {
      governance = await this.policiesService.getGovernanceStats(tenantId);
    } catch {
      // Policies table may not exist yet (run backend/scripts/policies-migration.sql)
    }

    return {
      assets: assetStats,
      licenses: licenseCompliance,
      applications: appStats,
      staff: staffStats,
      governance,
      summary: {
        totalAssets: assetStats.total,
        licenseIssues: licenseCompliance.overAllocated + licenseCompliance.expiringSoon,
        criticalSystems: appStats.byCriticality?.critical ?? 0,
        staffCount: staffStats.total ?? 0,
      },
    };
  }

  async getExecutiveDashboard(tenantId: string) {
    const ictManager = await this.getIctManagerDashboard(tenantId);
    return {
      ictPerformanceScore: this.computePerformanceScore(ictManager),
      riskExposure: {
        licenseCompliance: ictManager.licenses.overAllocated > 0 ? 'warning' : 'ok',
        expiringLicenses: ictManager.licenses.expiringSoon,
      },
      strategicAlignment: {
        totalSystems: ictManager.applications.total,
        criticalSystems: ictManager.summary.criticalSystems,
      },
      ...ictManager,
    };
  }

  private computePerformanceScore(d: { assets: { total: number }; licenses: { overAllocated: number; expiringSoon: number }; summary: { criticalSystems: number } }): number {
    let score = 100;
    if (d.licenses.overAllocated > 0) score -= 15;
    score -= Math.min(20, d.licenses.expiringSoon * 5);
    return Math.max(0, score);
  }
}
