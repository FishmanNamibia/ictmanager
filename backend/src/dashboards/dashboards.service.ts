import { Injectable, Logger } from '@nestjs/common';
import { TenantService } from '../tenant/tenant.service';
import { AssetsService } from '../assets/assets.service';
import { ApplicationsService } from '../applications/applications.service';
import { StaffService } from '../staff/staff.service';
import { PoliciesService } from '../policies/policies.service';
import { CybersecurityService } from '../cybersecurity/cybersecurity.service';
import { ServiceDeskService } from '../service-desk/service-desk.service';
import { DataGovernanceService } from '../data-governance/data-governance.service';
import { RiskComplianceService } from '../risk-compliance/risk-compliance.service';
import { ChangeManagementService } from '../change-management/change-management.service';
import { VendorsContractsService } from '../vendors-contracts/vendors-contracts.service';
import { buildStreamlinedSections, ReportSection as StreamlinedReportSection } from './executive-report-builder';
import { generatePuppeteerPdf } from './puppeteer-pdf-generator';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

type ConfidenceLevel = 'high' | 'moderate' | 'low';
type Direction = 'improving' | 'stable' | 'deteriorating';
type AttentionLevel = 'low' | 'medium' | 'high' | 'critical';

type TrendComparison = {
  current: number;
  previous: number;
  delta: number;
  direction: Direction;
  narrative: string;
};

type SectionConfidence = {
  level: ConfidenceLevel;
  narrative: string;
};

type ReportSection = {
  title: string;
  summary: string;
  keyMetrics: Array<{ label: string; value: string | number; status: 'good' | 'warning' | 'critical' }>;
  keyRisks: string[];
  recommendations: string[];
  boardAttentionLevel: AttentionLevel;
  dataConfidence: SectionConfidence;
};

type ActionRegisterItem = {
  issue: string;
  explanation: string;
  businessImpact: string;
  recommendedAction: string;
  owner: string;
  dueDate: string;
  priority: AttentionLevel;
  status: string;
  escalationRequired: boolean;
};

type ExecutiveReportPayload = {
  generatedAt: string;
  audience: string;
  headline: {
    posture: 'stable' | 'watch' | 'critical';
    ictPerformanceScore: number;
    summary: string;
  };
  executiveSummary: {
    overallInstitutionalIctPosture: string;
    keyAchievementsThisPeriod: string[];
    topRisksAndWatchItems: string[];
    majorDecisionsRequiredFromManagement: string[];
    urgentManagementActions: string[];
    outlookForNextReportingPeriod: string;
  };
  keyMessages: string[];
  topRisks: string[];
  watchItems: string[];
  assuranceObservations: string[];
  decisionsRequired: string[];
  recommendations: string[];
  sections: ReportSection[];
  managementActionRegister: ActionRegisterItem[];
  appendix: {
    metricDefinitions: Array<{ metric: string; definition: string }>;
    thresholdLogic: Array<{ area: string; rule: string }>;
    detailedSystemList: Array<{ name: string; criticality: string; healthLabel: string; owner: string | null }>;
    riskRegisterExtract: Array<{ title: string; score: number; owner: string | null; status: string }>;
    openIssuesByCategory: Array<{ category: string; count: number }>;
    incidentBreakdown: Array<{ title: string; severity: string; status: string; reported: string | null }>;
    drPlanInventory: Array<{ planName: string; status: string; failoverType: string; nextDrTestDate: string | null }>;
    vendorExposureSummary: Array<{ title: string; status: string; endDate: string | null; owner: string | null }>;
    complianceEvidenceSummary: Array<{ policy: string; compliancePercent: number }>;
  };
  snapshot: Record<string, unknown>;
};

type PeriodRange = { start: Date; end: Date };

function toIsoDate(value?: Date | null): string | null {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 10);
}

@Injectable()
export class DashboardsService {
  private readonly logger = new Logger(DashboardsService.name);

  constructor(
    private readonly assetsService: AssetsService,
    private readonly applicationsService: ApplicationsService,
    private readonly staffService: StaffService,
    private readonly policiesService: PoliciesService,
    private readonly cybersecurityService: CybersecurityService,
    private readonly serviceDeskService: ServiceDeskService,
    private readonly dataGovernanceService: DataGovernanceService,
    private readonly riskComplianceService: RiskComplianceService,
    private readonly changeManagementService: ChangeManagementService,
    private readonly vendorsContractsService: VendorsContractsService,
    private readonly tenantService: TenantService,
  ) {}

  private async safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      this.logger.warn(`${label} widget failed: ${(e as Error)?.message ?? 'unknown error'}`);
      return fallback;
    }
  }

  private startOfMonth(base = new Date()): Date {
    return new Date(base.getFullYear(), base.getMonth(), 1);
  }

  private endOfMonth(base = new Date()): Date {
    return new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  private startOfQuarter(base = new Date()): Date {
    const quarterMonth = Math.floor(base.getMonth() / 3) * 3;
    return new Date(base.getFullYear(), quarterMonth, 1);
  }

  private endOfQuarter(base = new Date()): Date {
    const quarterMonth = Math.floor(base.getMonth() / 3) * 3;
    return new Date(base.getFullYear(), quarterMonth + 3, 0, 23, 59, 59, 999);
  }

  private previousMonthRange(base = new Date()): PeriodRange {
    const start = new Date(base.getFullYear(), base.getMonth() - 1, 1);
    const end = new Date(base.getFullYear(), base.getMonth(), 0, 23, 59, 59, 999);
    return { start, end };
  }

  private currentMonthRange(base = new Date()): PeriodRange {
    return { start: this.startOfMonth(base), end: this.endOfMonth(base) };
  }

  private previousQuarterRange(base = new Date()): PeriodRange {
    const quarterMonth = Math.floor(base.getMonth() / 3) * 3;
    const start = new Date(base.getFullYear(), quarterMonth - 3, 1);
    const end = new Date(base.getFullYear(), quarterMonth, 0, 23, 59, 59, 999);
    return { start, end };
  }

  private currentQuarterRange(base = new Date()): PeriodRange {
    return { start: this.startOfQuarter(base), end: this.endOfQuarter(base) };
  }

  private countInRange<T>(items: T[], dateSelector: (item: T) => Date | null | undefined, range: PeriodRange): number {
    return items.filter((item) => {
      const value = dateSelector(item);
      if (!value) return false;
      const date = new Date(value);
      return date >= range.start && date <= range.end;
    }).length;
  }

  private asDirection(current: number, previous: number, lowerIsBetter = false): Direction {
    if (current === previous) return 'stable';
    if (lowerIsBetter) return current < previous ? 'improving' : 'deteriorating';
    return current > previous ? 'improving' : 'deteriorating';
  }

  private comparePeriods(label: string, current: number, previous: number, lowerIsBetter = false): TrendComparison {
    const delta = current - previous;
    const direction = this.asDirection(current, previous, lowerIsBetter);
    const movement = delta === 0 ? 'unchanged' : delta > 0 ? `up by ${delta}` : `down by ${Math.abs(delta)}`;
    const meaning =
      direction === 'stable'
        ? 'The control position is broadly unchanged over the comparison period.'
        : direction === 'improving'
          ? lowerIsBetter
            ? 'The movement indicates pressure is easing.'
            : 'The movement indicates improving operational throughput or control adoption.'
          : lowerIsBetter
            ? 'The movement indicates worsening pressure or unresolved exposure.'
            : 'The movement indicates weakening control performance or growing exposure.';
    return {
      current,
      previous,
      delta,
      direction,
      narrative: `${label} is ${movement} against the prior comparison period (${current} versus ${previous}). ${meaning}`,
    };
  }

  private confidence(level: ConfidenceLevel, narrative: string): SectionConfidence {
    return { level, narrative };
  }

  private addDays(base: Date, days: number): string {
    return new Date(base.getTime() + days * 86_400_000).toISOString().slice(0, 10);
  }

  private summariseConfidence(zeroHeavy: boolean, datedRecords: number, hasHistoricalContext: boolean, domain: string): SectionConfidence {
    if (datedRecords === 0) {
      return this.confidence(
        'low',
        `${domain} reporting currently has very limited underlying event history. Zero or perfect values may reflect either genuine stability or early-stage data capture, so management should validate source completeness before taking assurance at face value.`,
      );
    }
    if (zeroHeavy || !hasHistoricalContext) {
      return this.confidence(
        'moderate',
        `${domain} reporting is supported by live source data, but the historical baseline remains thin in places. Reported stability should therefore be read as provisional rather than fully mature assurance.`,
      );
    }
    return this.confidence(
      'high',
      `${domain} reporting is supported by recent underlying records and a usable comparison period, so the reported direction of travel can be treated as a reliable management signal.`,
    );
  }

  private credibilityAdjustedScore(baseScore: number, lowConfidenceDomains: number, moderateConfidenceDomains: number, perfectSignals: number): number {
    const penalty = lowConfidenceDomains * 12 + moderateConfidenceDomains * 4 + perfectSignals * 3;
    const cappedScore = lowConfidenceDomains > 0 ? Math.min(baseScore, 74) : moderateConfidenceDomains > 2 ? Math.min(baseScore, 82) : baseScore;
    return Math.max(28, cappedScore - penalty);
  }

  private monthSeries<T>(
    items: T[],
    dateSelector: (item: T) => Date | null | undefined,
    months = 5,
  ): { labels: string[]; values: number[] } {
    const labels: string[] = [];
    const values: number[] = [];
    const today = new Date();
    for (let offset = months - 1; offset >= 0; offset -= 1) {
      const start = new Date(today.getFullYear(), today.getMonth() - offset, 1);
      const end = new Date(today.getFullYear(), today.getMonth() - offset + 1, 0, 23, 59, 59, 999);
      labels.push(start.toLocaleString('en-GB', { month: 'short' }));
      values.push(this.countInRange(items, dateSelector, { start, end }));
    }
    return { labels, values };
  }

  private metricDisplay(connected: boolean, value: string | number, suffix = ''): string {
    return connected ? `${value}${suffix}` : 'Awaiting data integration';
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
      // Policies table may not exist yet.
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

  async getExecutiveReport(tenantId: string): Promise<ExecutiveReportPayload> {
    const month = this.currentMonthRange();
    const prevMonth = this.previousMonthRange();
    const quarter = this.currentQuarterRange();
    const prevQuarter = this.previousQuarterRange();

    const [
      core,
      policyCompliance,
      governance,
      cybersecurity,
      serviceDesk,
      dataGovernance,
      risks,
      drOverview,
      changes,
      vendors,
      applications,
      tickets,
      incidents,
      cyberRisks,
      vulnerabilities,
      accessReviews,
      drPlans,
      riskItems,
      findings,
      changeList,
      releaseList,
      contracts,
      vendorList,
      policies,
    ] = await Promise.all([
      this.getExecutiveDashboard(tenantId),
      this.safe('policy compliance', () => this.policiesService.getComplianceStats(tenantId), {
        total: 0,
        ackCounts: [],
        overallRequiredUsers: 0,
        overallAcknowledgedUsers: 0,
        overallCompliancePercent: 0,
        byPolicy: [],
        byDepartment: [],
      }),
      this.safe('governance', () => this.policiesService.getGovernanceStats(tenantId), {
        total: 0,
        overdueForReview: 0,
        approved: 0,
        draft: 0,
        expired: 0,
        overduePolicies: [],
      }),
      this.safe('cybersecurity', () => this.cybersecurityService.getSecurityDashboardStats(tenantId), {
        incidentStats: { total: 0, byStatus: {}, bySeverity: {}, activeIncidents: 0 },
        riskStats: { total: 0, byLevel: {}, criticalCount: 0, overallRiskTrend: 'stable' },
        vulnerabilityStats: { total: 0, bySeverity: {}, unpatchedCount: 0, overduePatchCount: 0 },
        accessReviewStats: { total: 0, byStatus: {}, overdueCount: 0, nextDueInDays: null },
      }),
      this.safe('service desk', () => this.serviceDeskService.getServiceDeskStats(tenantId), {
        totalTickets: 0,
        openTickets: 0,
        byStatus: {},
        byPriority: {},
        averageResolutionTime: 0,
        overdueTickets: 0,
      }),
      this.safe('data governance', () => this.dataGovernanceService.getGovernanceStats(tenantId), {
        totalAssets: 0,
        assetsByClassification: {},
        processingRecords: 0,
        pendingDPIA: 0,
        qualityMetrics: 0,
        lowQualityAssets: 0,
      }),
      this.safe('risk compliance', () => this.riskComplianceService.getDashboardStats(tenantId), {
        risks: { total: 0, open: 0, highScore: 0, overdueReviews: 0, byDomain: {}, byStatus: {} },
        findings: { total: 0, open: 0, overdue: 0, highSeverityOpen: 0, byStatus: {} },
        compliancePosture: { overallScore: 0, atRiskAreas: [] },
      }),
      this.safe('dr overview', () => this.riskComplianceService.getDisasterRecoveryOverview(tenantId), {
        summary: {
          totalPlans: 0,
          activePlans: 0,
          automatedFailoverPlans: 0,
          plansNeedingReview: 0,
          uncoveredCriticalApps: 0,
        },
        items: [],
      }),
      this.safe('change management', () => this.changeManagementService.getDashboardStats(tenantId), {
        changes: { total: 0, open: 0, pendingApprovals: 0, highRisk: 0, scheduledThisMonth: 0, successRatePercent: 0 },
        releases: { total: 0, planned: 0, completed: 0, failedOrRolledBack: 0, thisMonth: 0 },
      }),
      this.safe('vendor contracts', () => this.vendorsContractsService.getDashboardStats(tenantId), {
        totalVendors: 0,
        activeVendors: 0,
        activeContracts: 0,
        expiringIn90Days: 0,
        expiredContracts: 0,
        averageSlaMetPercent: 0,
        annualContractValue: 0,
        lowPerformanceVendors: 0,
      }),
      this.safe('applications detail', () => this.applicationsService.findAll(tenantId), []),
      this.safe('tickets detail', () => this.serviceDeskService.findTickets(tenantId), []),
      this.safe('incidents detail', () => this.cybersecurityService.findIncidents(tenantId), []),
      this.safe('cyber risks detail', () => this.cybersecurityService.findRisks(tenantId), []),
      this.safe('vulnerabilities detail', () => this.cybersecurityService.findVulnerabilities(tenantId), []),
      this.safe('access reviews detail', () => this.cybersecurityService.findAccessReviews(tenantId), []),
      this.safe('dr plans detail', () => this.riskComplianceService.listDisasterRecoveryPlans(tenantId), []),
      this.safe('risk items detail', () => this.riskComplianceService.listRisks(tenantId), []),
      this.safe('findings detail', () => this.riskComplianceService.listFindings(tenantId), []),
      this.safe('changes detail', () => this.changeManagementService.listChanges(tenantId), []),
      this.safe('releases detail', () => this.changeManagementService.listReleases(tenantId), []),
      this.safe('contracts detail', () => this.vendorsContractsService.listContracts(tenantId), []),
      this.safe('vendors detail', () => this.vendorsContractsService.listVendors(tenantId), []),
      this.safe('policies detail', () => this.policiesService.findAll(tenantId), []),
    ]);

    const ticketsMoM = this.comparePeriods(
      'Tickets raised this month',
      this.countInRange(tickets, (item) => item.createdAt, month),
      this.countInRange(tickets, (item) => item.createdAt, prevMonth),
      true,
    );
    const incidentsQoQ = this.comparePeriods(
      'Security incidents this quarter',
      this.countInRange(incidents, (item) => item.dateReported || item.createdAt, quarter),
      this.countInRange(incidents, (item) => item.dateReported || item.createdAt, prevQuarter),
      true,
    );
    const vulnQoQ = this.comparePeriods(
      'Vulnerabilities identified this quarter',
      this.countInRange(vulnerabilities, (item) => item.discoveredDate || item.createdAt, quarter),
      this.countInRange(vulnerabilities, (item) => item.discoveredDate || item.createdAt, prevQuarter),
      true,
    );
    const changesMoM = this.comparePeriods(
      'Changes logged this month',
      this.countInRange(changeList, (item) => item.createdAt, month),
      this.countInRange(changeList, (item) => item.createdAt, prevMonth),
    );
    const drTestsQoQ = this.comparePeriods(
      'DR tests completed this quarter',
      this.countInRange(drPlans, (item) => item.lastDrTestDate, quarter),
      this.countInRange(drPlans, (item) => item.lastDrTestDate, prevQuarter),
    );
    const policyApprovalsMoM = this.comparePeriods(
      'Policy approvals or reviews this month',
      this.countInRange(policies, (item) => item.approvalDate || item.lastReviewDate, month),
      this.countInRange(policies, (item) => item.approvalDate || item.lastReviewDate, prevMonth),
    );

    const currentContractExposure = contracts.filter((contract) => {
      if (!contract.endDate) return false;
      const end = new Date(contract.endDate);
      const inNinetyDays = new Date();
      inNinetyDays.setDate(inNinetyDays.getDate() + 90);
      return end >= new Date() && end <= inNinetyDays;
    }).length;
    const previousContractReference = new Date();
    previousContractReference.setMonth(previousContractReference.getMonth() - 1);
    const previousContractExposure = contracts.filter((contract) => {
      if (!contract.endDate) return false;
      const end = new Date(contract.endDate);
      const futureWindow = new Date(previousContractReference);
      futureWindow.setDate(futureWindow.getDate() + 90);
      return end >= previousContractReference && end <= futureWindow;
    }).length;
    const contractExposureMoM = this.comparePeriods(
      'Contract expiry exposure within 90 days',
      currentContractExposure,
      previousContractExposure,
      true,
    );

    const postureConfidence = this.summariseConfidence(
      core.applications.total === 0 || core.applications.criticalHealth === 0,
      applications.length + riskItems.length + findings.length,
      true,
      'Institution-wide ICT posture',
    );
    const operationsConfidence = this.summariseConfidence(
      tickets.length === 0 || serviceDesk.openTickets === 0,
      tickets.length + changeList.length + releaseList.length,
      true,
      'Operations and service continuity',
    );
    const cyberConfidence = this.summariseConfidence(
      incidents.length === 0 && vulnerabilities.length === 0,
      incidents.length + vulnerabilities.length + accessReviews.length + cyberRisks.length,
      true,
      'Cybersecurity',
    );
    const drConfidence = this.summariseConfidence(
      drPlans.length === 0 || drOverview.summary.automatedFailoverPlans === 0,
      drPlans.length + drOverview.items.length,
      drPlans.length > 0,
      'Business continuity and disaster recovery',
    );
    const supplierConfidence = this.summariseConfidence(
      contracts.length === 0,
      contracts.length + vendorList.length,
      contracts.length > 0,
      'Supplier management',
    );
    const governanceConfidence = this.summariseConfidence(
      policies.length === 0 || policyCompliance.overallCompliancePercent === 100 || policyCompliance.overallCompliancePercent === 0,
      policies.length,
      policies.length > 0,
      'Governance and compliance',
    );
    const postureDataGap = applications.length === 0 && riskItems.length === 0 && findings.length === 0;
    const operationsDataGap = tickets.length === 0 && changeList.length === 0 && releaseList.length === 0;
    const cyberDataGap = incidents.length === 0 && vulnerabilities.length === 0 && accessReviews.length === 0 && cyberRisks.length === 0;
    const drDataGap = drPlans.length === 0;
    const supplierDataGap = contracts.length === 0 && vendorList.length === 0;
    const governanceDataGap = policies.length === 0;
    const sourceConnected = {
      posture: !postureDataGap,
      operations: !operationsDataGap,
      cyber: !cyberDataGap,
      dr: !drDataGap,
      supplier: !supplierDataGap,
      governance: !governanceDataGap,
    };
    const lowConfidenceDomains = [postureConfidence, operationsConfidence, cyberConfidence, drConfidence, supplierConfidence, governanceConfidence]
      .filter((item) => item.level === 'low').length;
    const moderateConfidenceDomains = [postureConfidence, operationsConfidence, cyberConfidence, drConfidence, supplierConfidence, governanceConfidence]
      .filter((item) => item.level === 'moderate').length;
    const perfectSignals = Number(core.ictPerformanceScore === 100) + Number(policyCompliance.overallCompliancePercent === 100) + Number(serviceDesk.openTickets === 0) + Number(cybersecurity.incidentStats.activeIncidents === 0);
    const executiveScore = this.credibilityAdjustedScore(core.ictPerformanceScore, lowConfidenceDomains, moderateConfidenceDomains, perfectSignals);

    // Use streamlined report builder for concise, readable sections
    const sections = buildStreamlinedSections({
      core,
      risks,
      cybersecurity,
      serviceDesk,
      changes,
      drOverview,
      vendors,
      governance,
      policyCompliance,
      dataGovernance,
      executiveScore,
      sourceConnected,
      dataGaps: {
        posture: postureDataGap,
        operations: operationsDataGap,
        cyber: cyberDataGap,
        dr: drDataGap,
        supplier: supplierDataGap,
        governance: governanceDataGap,
      },
      confidenceLevels: {
        posture: postureConfidence,
        operations: operationsConfidence,
        cyber: cyberConfidence,
        dr: drConfidence,
        supplier: supplierConfidence,
        governance: governanceConfidence,
      },
    });

    // Legacy section structure for backward compatibility (will be removed)
    const legacySections: any[] = [
      {
        title: 'ICT Performance & Risk Posture',
        summary: sections[0].summary,
        currentPosition: sections[0].summary,
        interpretation: '',
        keyRiskOrConcern: sections[0].keyRisks.join('; '),
        businessImpact: '',
        trendComparison: '',
        managementImplications: '',
        rootCauseCommentary: '',
        recommendedManagementAction: sections[0].recommendations.join('; '),
        boardAttentionLevel: sections[0].boardAttentionLevel,
        dataConfidence: sections[0].dataConfidence,
        metrics: sections[0].keyMetrics.map(m => `${m.label}: ${m.value}`),
      },
      {
        title: 'Operations and service continuity',
        currentPosition: operationsDataGap
          ? 'No formal ticket, change, or release activity is being captured at a level that supports reliable operational reporting. This should be treated as a monitoring gap, not as evidence of zero demand.'
          : `${serviceDesk.openTickets} service desk tickets remain open, ${serviceDesk.overdueTickets} are overdue, and average resolution time is ${serviceDesk.averageResolutionTime} hours. ${changes.changes.pendingApprovals} change requests are pending approval.`,
        interpretation: serviceDesk.openTickets === 0 && tickets.length === 0
          ? 'An entirely quiet service desk does not automatically indicate excellence. It may reflect strong operational stability, but it may also point to weak adoption of the service desk channel or incomplete ticket logging.'
          : 'The current service figures indicate the level of operational demand being absorbed by ICT and how effectively work is being closed. Overdue tickets or delayed approvals generally signal pressure on service teams, process bottlenecks, or weak escalation discipline.',
        keyRiskOrConcern: serviceDesk.overdueTickets > 0
          ? 'Overdue service tickets remain the immediate operational concern because unresolved support demand can accumulate into user frustration, shadow workarounds, and avoidable service interruptions.'
          : 'The absence of overdue tickets is positive, but management should still verify that all user demand is flowing through the service desk rather than being resolved informally outside the reporting channel.',
        businessImpact: 'Operations performance affects staff productivity, service availability, user confidence in ICT, and the institutionâ€™s ability to execute change safely without backlogs undermining day-to-day service delivery.',
        trendComparison: `${ticketsMoM.narrative} ${changesMoM.narrative}`,
        managementImplications: 'If demand is rising while closure rates remain flat, the operating model may need stronger prioritisation, resourcing, or triage controls. Where volume is low, management should confirm whether that reflects true stability or under-reporting.',
        rootCauseCommentary: serviceDesk.overdueTickets > 0 || changes.changes.pendingApprovals > 0
          ? 'The most likely underlying causes are delayed assignment, insufficient escalation of aging tickets, and approval bottlenecks in the change process.'
          : 'The current control position suggests either good operational discipline or a low-reporting environment. Management should use audit sampling to distinguish between these two possibilities.',
        recommendedManagementAction: 'Institute a weekly operational review for overdue tickets and pending changes, validate that major incidents are logged formally, and confirm that user support demand is not bypassing the service desk.',
        boardAttentionLevel: serviceDesk.overdueTickets > 5 ? 'high' : serviceDesk.openTickets > 0 || changes.changes.pendingApprovals > 0 ? 'medium' : 'low',
        dataConfidence: operationsConfidence,
        summary: operationsDataGap
          ? 'Service desk and change records are too limited to support a reliable continuity view.'
          : `${serviceDesk.openTickets} service desk tickets remain open, ${serviceDesk.overdueTickets} are overdue, and average resolution time is ${serviceDesk.averageResolutionTime} hours.`,
        metrics: [
          `Open tickets: ${this.metricDisplay(sourceConnected.operations, serviceDesk.openTickets)}`,
          `Overdue tickets: ${this.metricDisplay(sourceConnected.operations, serviceDesk.overdueTickets)}`,
          `Open changes: ${this.metricDisplay(sourceConnected.operations, changes.changes.open)}`,
          `Pending change approvals: ${this.metricDisplay(sourceConnected.operations, changes.changes.pendingApprovals)}`,
        ],
      },
      {
        title: 'Cybersecurity',
        currentPosition: cyberDataGap
          ? 'The cyber dashboard is not yet receiving enough incident, vulnerability, or access-review records to support executive assurance. Reported zeros should therefore be treated as low-confidence.'
          : `${cybersecurity.incidentStats.activeIncidents} active incidents, ${cybersecurity.vulnerabilityStats.unpatchedCount} unpatched vulnerabilities, and ${cybersecurity.accessReviewStats.overdueCount} overdue access reviews are currently reported.`,
        interpretation: incidents.length === 0 && vulnerabilities.length === 0
          ? 'A zero-incident or zero-vulnerability position may reflect strong control health, but it may also indicate limited security monitoring maturity, immature vulnerability intake, or low incident logging discipline.'
          : 'The current figures indicate the live cyber workload being carried by the institution. Active incidents and overdue remediation show where exposure is not yet contained, while access review backlog indicates whether access governance remains disciplined.',
        keyRiskOrConcern: cybersecurity.vulnerabilityStats.overduePatchCount > 0
          ? `${cybersecurity.vulnerabilityStats.overduePatchCount} overdue vulnerability remediation items indicate that known weaknesses remain exposed longer than planned.`
          : cybersecurity.incidentStats.activeIncidents > 0
            ? `${cybersecurity.incidentStats.activeIncidents} active incidents require continued management oversight until containment and closure are verified.`
            : 'No immediate cyber red flags are recorded, but management should still monitor the quality of threat detection, incident logging, and vulnerability coverage.',
        businessImpact: 'Cyber control weakness can disrupt services, expose sensitive information, trigger regulatory consequences, and damage institutional reputation. Even moderate cyber backlogs can become strategic if critical systems are involved.',
        trendComparison: `${incidentsQoQ.narrative} ${vulnQoQ.narrative}`,
        managementImplications: 'Management should focus on whether the cyber function is detecting issues early, closing them within target, and producing enough evidence to support board assurance rather than simply reporting low numbers.',
        rootCauseCommentary: cybersecurity.vulnerabilityStats.overduePatchCount > 0 || cybersecurity.accessReviewStats.overdueCount > 0
          ? 'Likely root causes include patch scheduling delays, competing operational priorities, limited remediation ownership, or inconsistent access review cadence.'
          : 'The current position may indicate effective preventive controls, but it may equally indicate a detection or logging gap if telemetry coverage is incomplete.',
        recommendedManagementAction: 'Prioritise overdue remediation on critical assets, clear access review backlog, and validate that incident and vulnerability reporting is complete enough to support executive assurance.',
        boardAttentionLevel: cybersecurity.incidentStats.activeIncidents > 0 || cybersecurity.vulnerabilityStats.overduePatchCount > 0 ? 'high' : 'medium',
        dataConfidence: cyberConfidence,
        summary: cyberDataGap
          ? 'Cybersecurity source data is too thin to treat zero incidents or vulnerabilities as strong assurance.'
          : `${cybersecurity.incidentStats.activeIncidents} active security incidents, ${cybersecurity.vulnerabilityStats.unpatchedCount} unpatched vulnerabilities, and ${policyCompliance.overallCompliancePercent}% policy compliance are currently reported.`,
        metrics: [
          `Active incidents: ${this.metricDisplay(sourceConnected.cyber, cybersecurity.incidentStats.activeIncidents)}`,
          `Critical cyber risks: ${this.metricDisplay(sourceConnected.cyber, cybersecurity.riskStats.criticalCount)}`,
          `Overdue patches: ${this.metricDisplay(sourceConnected.cyber, cybersecurity.vulnerabilityStats.overduePatchCount)}`,
          `Overdue access reviews: ${this.metricDisplay(sourceConnected.cyber, cybersecurity.accessReviewStats.overdueCount)}`,
        ],
      },
      {
        title: 'Business continuity and disaster recovery',
        currentPosition: drDataGap
          ? 'Formal disaster recovery records are materially incomplete. The absence of active plans should be treated as a resilience gap until plans, test history, and ownership records are loaded and maintained.'
          : `${drOverview.summary.activePlans} active DR plans are recorded, ${drOverview.summary.plansNeedingReview} plans need review, and ${drOverview.summary.uncoveredCriticalApps} critical or high-impact systems still show continuity gaps.`,
        interpretation: drPlans.length === 0
          ? 'The absence of recorded plans does not mean the institution is resilient; it more likely indicates that continuity arrangements are undocumented or not yet embedded in formal governance.'
          : 'The current figures show how much of the resilience position is documented, tested, and able to respond without manual intervention. Low levels of automated failover or overdue plan reviews point to continuity maturity limitations rather than only operational backlog.',
        keyRiskOrConcern: drOverview.summary.uncoveredCriticalApps > 0
          ? `${drOverview.summary.uncoveredCriticalApps} critical systems remain exposed because disaster recovery arrangements are missing, outdated, or still dependent on manual handoff.`
          : drOverview.summary.automatedFailoverPlans === 0
            ? 'No automated failover plans are recorded, which indicates that resilience is still dependent on manual intervention even where plans exist.'
            : 'No immediate continuity red flag is recorded, but the board should still watch testing cadence and the proportion of plans that remain manual.',
        businessImpact: 'Continuity weakness affects the institutionâ€™s ability to restore essential services during outages, cyber incidents, or infrastructure failure. The business consequence is extended downtime, delayed public service, and increased recovery cost during disruption.',
        trendComparison: `${drTestsQoQ.narrative} Disaster recovery readiness should also be read against manual failover exposure: ${drOverview.summary.automatedFailoverPlans} automated or semi-automated plans are recorded against ${drOverview.summary.activePlans} active plans.`,
        managementImplications: 'Management should not treat the existence of a plan as evidence of readiness. Executive assurance depends on tested plans, assigned recovery ownership, and reduction of manual dependency between systems that need to recover together.',
        rootCauseCommentary: drOverview.summary.uncoveredCriticalApps > 0 || drOverview.summary.automatedFailoverPlans === 0
          ? 'The likely causes are incomplete continuity governance, delayed plan maintenance, limited automation investment, and unresolved ownership of integrated recovery steps.'
          : 'The continuity environment appears more controlled, though ongoing testing remains necessary to avoid paper compliance without operational readiness.',
        recommendedManagementAction: 'Mandate quarterly review of all critical-system recovery plans, prioritise systems that still rely on manual failover, and assign named owners for recovery testing and backup verification.',
        boardAttentionLevel: drOverview.summary.uncoveredCriticalApps > 0 ? 'high' : drOverview.summary.plansNeedingReview > 0 ? 'medium' : 'low',
        dataConfidence: drConfidence,
        summary: drDataGap
          ? 'DR inventory remains incomplete and cannot yet support high-confidence continuity assurance.'
          : `${drOverview.summary.activePlans} active DR plans are recorded, while ${drOverview.summary.uncoveredCriticalApps} critical or high-impact systems still need continuity remediation.`,
        metrics: [
          `Total DR plans: ${this.metricDisplay(sourceConnected.dr, drOverview.summary.totalPlans)}`,
          `Automated failover plans: ${this.metricDisplay(sourceConnected.dr, drOverview.summary.automatedFailoverPlans)}`,
          `Plans needing review: ${this.metricDisplay(sourceConnected.dr, drOverview.summary.plansNeedingReview)}`,
          `Critical systems with DR gaps: ${this.metricDisplay(sourceConnected.dr, drOverview.summary.uncoveredCriticalApps)}`,
        ],
      },
      {
        title: 'Supplier management',
        currentPosition: supplierDataGap
          ? 'Supplier and contract records are too incomplete to support a reliable view of renewal exposure, vendor performance, or third-party continuity risk.'
          : `${vendors.expiringIn90Days} contracts expire within 90 days, ${vendors.expiredContracts} are already expired, and ${vendors.lowPerformanceVendors} vendors are currently below expected performance thresholds.`,
        interpretation: contracts.length === 0
          ? 'The absence of contract exposure data should not be read as a low-risk supplier environment. It may indicate that supplier records are incomplete or that contract metadata has not yet been fully maintained in the system.'
          : 'Current figures indicate the level of commercial and continuity exposure carried through external suppliers. Expired or near-expiry contracts increase the risk of service interruption, weak negotiating position, and delayed support response.',
        keyRiskOrConcern: vendors.expiredContracts > 0
          ? `${vendors.expiredContracts} supplier contracts are already expired, creating direct exposure to support interruption, unclear commercial terms, or unmanaged vendor dependence.`
          : vendors.expiringIn90Days > 0
            ? `${vendors.expiringIn90Days} contracts are approaching renewal windows, which requires timely management action to avoid avoidable continuity pressure.`
            : 'No immediate supplier expiry red flag is present, though low-performance or concentration risk should still remain under management review.',
        businessImpact: 'Supplier control matters because external vendors often underpin licensing, support, hosting, and specialist capability. Contract slippage can therefore become an operational continuity, financial, or compliance issue rather than only a procurement concern.',
        trendComparison: `${contractExposureMoM.narrative}`,
        managementImplications: 'Management should use supplier exposure data to anticipate continuity risk early, rather than allowing contracts to become urgent once support or renewal leverage is already weakened.',
        rootCauseCommentary: vendors.expiredContracts > 0 || vendors.expiringIn90Days > 0
          ? 'Likely root causes include weak renewal tracking, fragmented ownership of supplier relationships, and late escalation of commercial decisions.'
          : 'The current picture suggests acceptable contract timing discipline, but continuing validation is needed to ensure that all material suppliers are actually represented in the register.',
        recommendedManagementAction: 'Review all suppliers expiring within 90 days, confirm ownership and continuity clauses, and escalate any expired contract supporting a critical service.',
        boardAttentionLevel: vendors.expiredContracts > 0 ? 'high' : vendors.expiringIn90Days > 0 ? 'medium' : 'low',
        dataConfidence: supplierConfidence,
        summary: supplierDataGap
          ? 'Supplier and contract metadata is incomplete, so current third-party exposure cannot be treated as fully known.'
          : `${vendors.expiringIn90Days} contracts expire within 90 days, ${vendors.expiredContracts} are already expired, and ${dataGovernance.lowQualityAssets} data assets are flagged for low quality.`,
        metrics: [
          `Expiring contracts in 90 days: ${this.metricDisplay(sourceConnected.supplier, vendors.expiringIn90Days)}`,
          `Expired contracts: ${this.metricDisplay(sourceConnected.supplier, vendors.expiredContracts)}`,
          `Low-performance vendors: ${this.metricDisplay(sourceConnected.supplier, vendors.lowPerformanceVendors)}`,
          `Average SLA met: ${this.metricDisplay(sourceConnected.supplier, vendors.averageSlaMetPercent, '%')}`,
        ],
      },
      {
        title: 'Governance and compliance',
        currentPosition: governanceDataGap
          ? 'Governance reporting is not yet supported by enough policy and evidence records to justify confidence in compliance percentages or control maturity claims.'
          : `Policy compliance is ${policyCompliance.overallCompliancePercent}%, ${governance.overdueForReview} policies are overdue for review, and ${dataGovernance.pendingDPIA} data processing records still need DPIA attention.`,
        interpretation: policyCompliance.overallCompliancePercent === 100
          ? 'Perfect compliance figures should be interpreted carefully. They may reflect strong governance discipline, but they can also point to incomplete scope definition, acknowledgement coverage gaps, or evidence that has not yet been challenged.'
          : 'Current governance metrics indicate the maturity of policy lifecycle control, compliance adoption, and information stewardship discipline across the institution.',
        keyRiskOrConcern: governance.overdueForReview > 0
          ? `${governance.overdueForReview} policies are overdue for review, which suggests governance upkeep is lagging behind the institutionâ€™s control needs.`
          : dataGovernance.pendingDPIA > 0
            ? `${dataGovernance.pendingDPIA} DPIA actions remain incomplete, signalling that higher-risk data processing may still need formal privacy assessment.`
            : 'No major compliance exception is currently recorded, but watch items remain around evidence quality and the reliability of unusually perfect results.',
        businessImpact: 'Governance weakness exposes the institution to inconsistent control execution, reduced accountability, privacy or regulatory risk, and weaker management decision-making due to unclear or outdated policy baselines.',
        trendComparison: `${policyApprovalsMoM.narrative}`,
        managementImplications: 'Management should treat governance metrics as evidence of control upkeep, not just document administration. Late reviews or perfect compliance without challenge may both indicate governance immaturity.',
        rootCauseCommentary: governance.overdueForReview > 0 || dataGovernance.pendingDPIA > 0
          ? 'Likely causes include weak review cadence ownership, limited compliance follow-through, and incomplete embedding of privacy governance into operational change.'
          : 'The governance environment appears orderly, but the board should continue requiring evidence-based assurance to distinguish mature compliance from narrow or untested reporting.',
        recommendedManagementAction: 'Require overdue policy reviews to be cleared, validate 100% compliance results against evidence, and complete outstanding DPIA activity for higher-risk processing areas.',
        boardAttentionLevel: governance.overdueForReview > 0 || dataGovernance.pendingDPIA > 0 ? 'medium' : 'low',
        dataConfidence: governanceConfidence,
        summary: governanceDataGap
          ? 'Policy and evidence records are too sparse to treat perfect compliance as proven assurance.'
          : `${policyCompliance.overallCompliancePercent}% policy compliance is reported with ${governance.overdueForReview} overdue policies and ${dataGovernance.pendingDPIA} pending DPIA items.`,
        metrics: [
          `Policy compliance: ${this.metricDisplay(sourceConnected.governance, policyCompliance.overallCompliancePercent, '%')}`,
          `Policies overdue for review: ${this.metricDisplay(sourceConnected.governance, governance.overdueForReview)}`,
          `Pending DPIA actions: ${this.metricDisplay(sourceConnected.governance, dataGovernance.pendingDPIA)}`,
          `Low-quality data assets: ${this.metricDisplay(sourceConnected.governance, dataGovernance.lowQualityAssets)}`,
        ],
      },
    ];

    const keyAchievementsThisPeriod = [
      executiveScore >= 70 && !postureDataGap ? 'Overall ICT posture remains within a manageable range, though confidence depends on continued improvement in source completeness.' : null,
      cybersecurity.incidentStats.activeIncidents === 0 && !cyberDataGap ? 'No active cybersecurity incidents currently require crisis-level escalation.' : null,
      serviceDesk.overdueTickets === 0 && tickets.length > 0 ? 'Service desk backlog is under control with no overdue tickets currently recorded.' : null,
      governance.overdueForReview === 0 && policies.length > 0 && policyCompliance.overallCompliancePercent < 100 ? 'Policy review backlog is currently contained with no overdue review exceptions.' : null,
      vendors.expiredContracts === 0 && contracts.length > 0 ? 'No supplier contracts are currently recorded as expired.' : null,
    ].filter((item): item is string => !!item);

    const watchItems = [
      postureDataGap ? 'Enterprise posture cannot yet be validated strongly because application and risk records remain sparse.' : null,
      incidents.length === 0 ? 'Incident volumes are exceptionally low; management should verify that security event logging and escalation remain complete.' : null,
      serviceDesk.openTickets === 0 ? 'Zero open tickets may indicate strong stability, but may also suggest support activity is occurring outside the formal service desk channel.' : null,
      policyCompliance.overallCompliancePercent === 100 ? 'Perfect policy compliance should be periodically challenged against evidence to avoid false assurance.' : null,
      drOverview.summary.plansNeedingReview > 0 ? `${drOverview.summary.plansNeedingReview} disaster recovery plans still require review and should remain under management watch.` : null,
      supplierDataGap ? 'Supplier and contract exposure cannot yet be treated as fully known because metadata coverage is incomplete.' : null,
      vendors.lowPerformanceVendors > 0 ? `${vendors.lowPerformanceVendors} suppliers remain below expected performance and may warrant closer oversight even if contracts are not immediately expiring.` : null,
    ].filter((item): item is string => !!item);

    const assuranceObservations = [
      core.ictPerformanceScore >= 75 ? 'The institution retains a workable control baseline across its managed ICT domains.' : null,
      drPlans.length > 0 ? 'Continuity planning is now represented in the platform, creating a basis for more formal resilience oversight.' : null,
      policyCompliance.byDepartment.length > 0 ? 'Policy compliance can now be analysed across departments rather than only at global level.' : null,
    ].filter((item): item is string => !!item);

    const topRisks = [
      risks.risks.highScore > 0 ? `${risks.risks.highScore} high-score enterprise risks remain open in the institutional register.` : null,
      cybersecurity.vulnerabilityStats.overduePatchCount > 0 ? `${cybersecurity.vulnerabilityStats.overduePatchCount} vulnerabilities are overdue for remediation.` : null,
      drOverview.summary.uncoveredCriticalApps > 0 ? `${drOverview.summary.uncoveredCriticalApps} critical systems still have disaster recovery gaps.` : null,
      vendors.expiredContracts > 0 ? `${vendors.expiredContracts} contracts are already expired.` : null,
      cyberDataGap ? 'Cybersecurity monitoring data remains too thin to support high-confidence assurance.' : null,
      operationsDataGap ? 'Operational support activity is not being captured reliably enough to support service continuity assurance.' : null,
    ].filter((item): item is string => !!item);

    const decisionsRequired = [
      lowConfidenceDomains >= 2 ? 'Approve a management-led data completeness programme covering service desk, cybersecurity, supplier, and governance sources before relying on perfect or zero-based assurance.' : null,
      drOverview.summary.uncoveredCriticalApps > 0 ? 'Approve management focus and funding priority for critical-system disaster recovery remediation.' : null,
      vendors.expiringIn90Days > 0 || vendors.expiredContracts > 0 ? 'Confirm the contracting path for suppliers approaching or exceeding renewal limits.' : null,
      changes.changes.pendingApprovals > 0 ? 'Resolve pending change approvals that are blocking security or service stability improvements.' : null,
    ].filter((item): item is string => !!item);

    const recommendations = Array.from(new Set(sections.flatMap((section) => section.recommendations ?? [])));

    const actionRegister: ActionRegisterItem[] = [
      risks.risks.highScore > 0
        ? {
            issue: 'Open high-score enterprise risks',
            explanation: `${risks.risks.highScore} high-score risks remain unresolved in the institutional register.`,
            businessImpact: 'Unresolved enterprise risks may translate into service interruption, governance weakness, or delayed strategic delivery.',
            recommendedAction: 'Formally review, treat, or escalate all high-score risks with named accountabilities.',
            owner: 'ICT Manager',
            dueDate: this.addDays(new Date(), 30),
            priority: 'high',
            status: 'open',
            escalationRequired: true,
          }
        : null,
      drOverview.summary.uncoveredCriticalApps > 0
        ? {
            issue: 'Critical systems with DR gaps',
            explanation: `${drOverview.summary.uncoveredCriticalApps} critical or high-impact systems still lack fully mature recovery arrangements.`,
            businessImpact: 'A major outage could result in extended downtime, poor service continuity, and weak institutional recovery confidence.',
            recommendedAction: 'Complete recovery site, backup validation, and tested recovery plans for each uncovered critical system.',
            owner: 'Infrastructure and Applications Lead',
            dueDate: this.addDays(new Date(), 45),
            priority: 'high',
            status: 'open',
            escalationRequired: true,
          }
        : null,
      cybersecurity.vulnerabilityStats.overduePatchCount > 0
        ? {
            issue: 'Overdue cyber remediation',
            explanation: `${cybersecurity.vulnerabilityStats.overduePatchCount} vulnerabilities are past their target remediation dates.`,
            businessImpact: 'Known technical weaknesses remain exploitable for longer, increasing security and continuity exposure.',
            recommendedAction: 'Prioritise closure of overdue vulnerabilities affecting critical assets and report completion status weekly.',
            owner: 'Cybersecurity Lead',
            dueDate: this.addDays(new Date(), 14),
            priority: 'high',
            status: 'open',
            escalationRequired: true,
          }
        : null,
      serviceDesk.overdueTickets > 0
        ? {
            issue: 'Overdue service desk backlog',
            explanation: `${serviceDesk.overdueTickets} service tickets are overdue.`,
            businessImpact: 'Delayed support resolution can reduce staff productivity and increase informal workarounds outside controlled processes.',
            recommendedAction: 'Introduce weekly overdue-ticket escalation and confirm ownership for all aging tickets.',
            owner: 'Service Desk Lead',
            dueDate: this.addDays(new Date(), 14),
            priority: 'medium',
            status: 'open',
            escalationRequired: false,
          }
        : null,
      vendors.expiringIn90Days > 0 || vendors.expiredContracts > 0
        ? {
            issue: 'Supplier continuity exposure',
            explanation: `${vendors.expiredContracts} expired contracts and ${vendors.expiringIn90Days} contracts nearing expiry require active oversight.`,
            businessImpact: 'Support interruption, reduced negotiating leverage, or unmanaged vendor lock-in can affect core services.',
            recommendedAction: 'Review and escalate all supplier contracts that affect critical or externally hosted services.',
            owner: 'Vendor and Contract Owner',
            dueDate: this.addDays(new Date(), 21),
            priority: vendors.expiredContracts > 0 ? 'high' : 'medium',
            status: 'open',
            escalationRequired: vendors.expiredContracts > 0,
          }
        : null,
      governance.overdueForReview > 0 || dataGovernance.pendingDPIA > 0
        ? {
            issue: 'Governance upkeep backlog',
            explanation: `${governance.overdueForReview} policies are overdue for review and ${dataGovernance.pendingDPIA} DPIA items remain pending.`,
            businessImpact: 'Outdated governance and incomplete privacy assessment increase compliance and control-execution risk.',
            recommendedAction: 'Clear overdue policy reviews and complete pending DPIA items with accountable owners.',
            owner: 'Governance and Compliance Lead',
            dueDate: this.addDays(new Date(), 30),
            priority: 'medium',
            status: 'open',
          escalationRequired: false,
        }
        : null,
      operationsDataGap
        ? {
            issue: 'Operational reporting gap',
            explanation: 'Ticket, change, and release records are too limited to support reliable service continuity reporting.',
            businessImpact: 'Executives cannot distinguish true stability from under-reporting, which weakens decisions about support capacity, service levels, and operational risk.',
            recommendedAction: 'Mandate formal service desk usage, change logging, and monthly assurance checks on ticket capture completeness.',
            owner: 'Service Delivery Manager',
            dueDate: this.addDays(new Date(), 30),
            priority: 'high',
            status: 'open',
            escalationRequired: true,
          }
        : null,
      cyberDataGap
        ? {
            issue: 'Cybersecurity monitoring gap',
            explanation: 'Incident, vulnerability, and access-review activity is too sparse to support credible cyber assurance.',
            businessImpact: 'The institution may be carrying unseen security exposure while executive reporting presents a misleadingly clean position.',
            recommendedAction: 'Integrate security monitoring, vulnerability, and access review sources, then validate logging coverage and escalation quality.',
            owner: 'Cybersecurity Lead',
            dueDate: this.addDays(new Date(), 30),
            priority: 'high',
            status: 'open',
            escalationRequired: true,
          }
        : null,
      governanceDataGap || policyCompliance.overallCompliancePercent === 100
        ? {
            issue: 'Governance evidence confidence gap',
            explanation: governanceDataGap
              ? 'Policy and evidence records are too sparse to support dependable governance assurance.'
              : 'Perfect compliance is being reported and requires challenge testing against underlying evidence.',
            businessImpact: 'Executives may assume mature governance coverage where evidence quality or scope completeness has not yet been proven.',
            recommendedAction: 'Validate policy scope, acknowledgement evidence, and owner accountability before treating compliance scores as decision-grade.',
            owner: 'Governance and Compliance Lead',
            dueDate: this.addDays(new Date(), 21),
            priority: 'medium',
            status: 'open',
            escalationRequired: false,
          }
        : null,
    ].filter((item): item is ActionRegisterItem => !!item);

    const posture =
      executiveScore >= 75 && topRisks.length === 0 && lowConfidenceDomains === 0
        ? 'stable'
        : executiveScore >= 50
          ? 'watch'
          : 'critical';

    return {
      generatedAt: new Date().toISOString(),
      audience: 'EXCO / Board',
      headline: {
        posture,
        ictPerformanceScore: executiveScore,
        summary:
          posture === 'stable'
            ? 'ICT control posture is broadly stable. Reporting confidence is high and the current position supports executive assurance across key domains.'
            : posture === 'watch'
              ? `ICT posture requires management attention. ${lowConfidenceDomains > 0 ? `${lowConfidenceDomains} domain(s) have limited data visibility — this represents a governance gap requiring immediate action to close. ` : ''}Key issues are identified below for management follow-through.`
              : `ICT posture requires active executive intervention. ${lowConfidenceDomains > 0 ? `${lowConfidenceDomains} domain(s) lack sufficient data integration — incomplete reporting is itself a risk and must be treated as a management priority. ` : ''}Immediate action is required across resilience, cybersecurity, governance, and service continuity.`,
      },
      executiveSummary: {
        overallInstitutionalIctPosture: sections[0].summary,
        keyAchievementsThisPeriod: keyAchievementsThisPeriod.length ? keyAchievementsThisPeriod : [
          'ICT reporting framework is operational and actively tracking institutional data.',
          'Executive reporting structure established for board-level visibility.',
          'Management action register is active and tracking outstanding items.',
        ],
        topRisksAndWatchItems: [...topRisks, ...watchItems].slice(0, 8),
        majorDecisionsRequiredFromManagement: decisionsRequired.length ? decisionsRequired : ['Continue monitoring current status.'],
        urgentManagementActions: actionRegister.slice(0, 5).map((item) => `${item.issue}: ${item.recommendedAction}`),
        outlookForNextReportingPeriod: 'Next cycle will track progress on identified actions and emerging risks.',
      },
      keyMessages: sections.map((section) => section.summary).slice(0, 6),
      topRisks,
      watchItems,
      assuranceObservations,
      decisionsRequired,
      recommendations,
      sections: sections.map((section: any) => ({
        title: section.title,
        summary: section.summary,
        keyMetrics: section.keyMetrics || [],
        keyRisks: section.keyRisks || [],
        recommendations: section.recommendations || [],
        boardAttentionLevel: section.boardAttentionLevel,
        dataConfidence: section.dataConfidence,
      })),
      managementActionRegister: actionRegister,
      appendix: {
        metricDefinitions: [
          { metric: 'ICT Performance Score', definition: 'Composite indicator derived from license exposure and selected operational control factors.' },
          { metric: 'Policy Compliance', definition: 'Percentage of required users who have acknowledged in-scope policies.' },
          { metric: 'DR Gaps', definition: 'Critical or high-impact systems missing mature, tested, or fully owned continuity arrangements.' },
          { metric: 'Overdue Patch Count', definition: 'Vulnerabilities past target remediation date and not yet patched or mitigated.' },
        ],
        thresholdLogic: [
          { area: 'Board attention', rule: 'High or critical attention is assigned where unresolved exposure affects critical services, security remediation, or executive governance responsibilities.' },
          { area: 'Data confidence', rule: 'High confidence requires usable recent records and a comparison baseline; low confidence is assigned where zeros or perfect values may reflect limited source data.' },
          { area: 'Trend direction', rule: 'For risk-like indicators, lower counts are better; for positive throughput indicators such as plan testing or policy approvals, higher counts are better.' },
        ],
        detailedSystemList: applications.slice(0, 20).map((app) => ({
          name: app.name,
          criticality: app.criticality,
          healthLabel: app.healthLabel,
          owner: app.ictOwner || app.systemOwner || null,
        })),
        riskRegisterExtract: riskItems.slice(0, 15).map((risk) => ({
          title: risk.title,
          score: risk.riskScore,
          owner: risk.owner || null,
          status: risk.status,
        })),
        openIssuesByCategory: [
          { category: 'Service desk overdue', count: serviceDesk.overdueTickets },
          { category: 'High-score risks', count: risks.risks.highScore },
          { category: 'Overdue patches', count: cybersecurity.vulnerabilityStats.overduePatchCount },
          { category: 'DR gaps', count: drOverview.summary.uncoveredCriticalApps },
          { category: 'Expired contracts', count: vendors.expiredContracts },
          { category: 'Overdue policy reviews', count: governance.overdueForReview },
        ],
        incidentBreakdown: incidents.slice(0, 15).map((incident) => ({
          title: incident.title,
          severity: incident.severity,
          status: incident.status,
          reported: toIsoDate(incident.dateReported || incident.createdAt),
        })),
        drPlanInventory: drPlans.slice(0, 20).map((plan) => ({
          planName: plan.planName,
          status: plan.status,
          failoverType: plan.failoverType,
          nextDrTestDate: toIsoDate(plan.nextDrTestDate),
        })),
        vendorExposureSummary: contracts.slice(0, 20).map((contract) => ({
          title: contract.title,
          status: contract.status,
          endDate: toIsoDate(contract.endDate),
          owner: contract.owner || null,
        })),
        complianceEvidenceSummary: policyCompliance.byPolicy.slice(0, 20).map((policy) => ({
          policy: policy.title,
          compliancePercent: policy.compliancePercent,
        })),
      },
      snapshot: {
        core,
        governance,
        risks,
        drOverview,
        cybersecurity,
        serviceDesk,
        dataGovernance,
        changes,
        vendors,
        policyCompliance,
        periodComparisons: {
          ticketsMoM,
          incidentsQoQ,
          vulnerabilitiesQoQ: vulnQoQ,
          drTestsQoQ,
          policyApprovalsMoM,
          contractExposureMoM,
        },
        recentTrends: {
          posture: this.monthSeries([...riskItems, ...findings], (item) => item.createdAt, 5),
          incidents: this.monthSeries(incidents, (item) => item.dateReported || item.createdAt, 5),
        },
        sourceConnected,
      },
    };
  }

  async generateExecutiveReportPdf(tenantId: string): Promise<Buffer> {
    const [report, settings] = await Promise.all([
      this.getExecutiveReport(tenantId),
      this.tenantService.getExperienceSettings(tenantId).catch(() => null),
    ]);
    return generatePuppeteerPdf({
      ...report,
      organizationName: settings?.branding?.organizationName,
      systemName: settings?.branding?.systemName,
      audience: report.audience,
    });
  }


  private computePerformanceScore(d: { assets: { total: number }; licenses: { overAllocated: number; expiringSoon: number }; summary: { criticalSystems: number } }): number {
    let score = 100;
    if (d.licenses.overAllocated > 0) score -= 15;
    score -= Math.min(20, d.licenses.expiringSoon * 5);
    return Math.max(0, score);
  }
}
