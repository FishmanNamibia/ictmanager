import { Injectable } from '@nestjs/common';
import { AssetsService } from '../assets/assets.service';
import { ApplicationsService } from '../applications/applications.service';
import { StaffService } from '../staff/staff.service';

@Injectable()
export class DashboardsService {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly applicationsService: ApplicationsService,
    private readonly staffService: StaffService,
  ) {}

  async getIctManagerDashboard(tenantId: string) {
    const [assetStats, licenseCompliance, appStats, staffStats] = await Promise.all([
      this.assetsService.getAssetStats(tenantId),
      this.assetsService.getLicenseCompliance(tenantId),
      this.applicationsService.getPortfolioStats(tenantId),
      this.staffService.getSkillsGapStats(tenantId),
    ]);
    return {
      assets: assetStats,
      licenses: licenseCompliance,
      applications: appStats,
      staff: staffStats,
      summary: {
        totalAssets: assetStats.total,
        licenseIssues: licenseCompliance.overAllocated + licenseCompliance.expiringSoon,
        criticalSystems: appStats.byCriticality?.critical ?? 0,
        staffCount: staffStats.totalProfiles,
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
