import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ChangeRequest } from '../change-management/entities';
import { ChangeManagementService } from '../change-management/change-management.service';
import { SeverityLevel, Vulnerability, VulnerabilityStatus } from '../cybersecurity/entities';
import { CybersecurityService } from '../cybersecurity/cybersecurity.service';
import { LicenseWithMeta, LicensesService } from '../licenses/licenses.service';
import { Policy } from '../policies/policy.entity';
import { PoliciesService } from '../policies/policies.service';
import { AuditFinding, RiskRegisterItem } from '../risk-compliance/entities';
import { RiskComplianceService } from '../risk-compliance/risk-compliance.service';
import {
  RequestType,
  ServiceTicket,
  TicketPriority,
  TicketStatus,
} from '../service-desk/entities';
import { ServiceDeskService } from '../service-desk/service-desk.service';
import { TenantService } from '../tenant/tenant.service';
import { VendorContract } from '../vendors-contracts/entities/vendor-contract.entity';
import { VendorsContractsService } from '../vendors-contracts/vendors-contracts.service';
import { AutomationLink, AutomationRun } from './entities';

type AutomationRule =
  | 'contract_expiry'
  | 'license_compliance'
  | 'policy_overdue_review'
  | 'vulnerability_change';

type AutomationTargetType = 'risk' | 'ticket' | 'finding' | 'change';

type LinkKey = {
  automationType: AutomationRule;
  sourceType: string;
  sourceId: string;
};

type Outcome = 'created' | 'updated';

type RunCounters = {
  processedCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  ruleHits: Record<AutomationRule, number>;
};

export type AutomationRunResult = {
  runId: string | null;
  status: string;
  trigger: string;
  tenantId: string | null;
  processedCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  durationMs: number;
  startedAt: Date;
  completedAt: Date;
  ruleHits: Record<AutomationRule, number>;
  message?: string;
};

const AUTOMATION_REPORTER = 'automation@i-ictms.local';
const CONTRACT_NOTICE_FALLBACK_DAYS = 90;
const LICENSE_TICKET_WINDOW_DAYS = 30;

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);
  private running = false;

  constructor(
    @InjectRepository(AutomationLink)
    private readonly linkRepo: Repository<AutomationLink>,
    @InjectRepository(AutomationRun)
    private readonly runRepo: Repository<AutomationRun>,
    private readonly tenantService: TenantService,
    private readonly vendorsContractsService: VendorsContractsService,
    private readonly licensesService: LicensesService,
    private readonly policiesService: PoliciesService,
    private readonly cybersecurityService: CybersecurityService,
    private readonly riskComplianceService: RiskComplianceService,
    private readonly serviceDeskService: ServiceDeskService,
    private readonly changeManagementService: ChangeManagementService,
  ) {}

  @Cron('0 */30 * * * *')
  async handleScheduledRun(): Promise<void> {
    await this.executeRun('scheduled').catch((error: unknown) => {
      this.logger.error('Scheduled automation run failed', error instanceof Error ? error.stack : undefined);
    });
  }

  async runNow(tenantId: string): Promise<AutomationRunResult> {
    return this.executeRun('manual', tenantId);
  }

  async getStatus(tenantId: string) {
    const [lastTenantRun, lastGlobalRun, recentRuns, links] = await Promise.all([
      this.runRepo.findOne({ where: { tenantId }, order: { startedAt: 'DESC' } }),
      this.runRepo.findOne({ where: { tenantId: IsNull() }, order: { startedAt: 'DESC' } }),
      this.runRepo.find({
        where: [{ tenantId }, { tenantId: IsNull() }],
        order: { startedAt: 'DESC' },
        take: 10,
      }),
      this.linkRepo.find({
        where: { tenantId },
        order: { updatedAt: 'DESC' },
        take: 100,
      }),
    ]);

    const byAutomationType: Record<string, number> = {};
    const byTargetType: Record<string, number> = {};
    for (const link of links) {
      byAutomationType[link.automationType] = (byAutomationType[link.automationType] || 0) + 1;
      byTargetType[link.targetType] = (byTargetType[link.targetType] || 0) + 1;
    }

    return {
      running: this.running,
      lastRun: this.pickLatestRun(lastTenantRun, lastGlobalRun),
      recentRuns,
      linkSummary: {
        total: links.length,
        byAutomationType,
        byTargetType,
        lastEvaluatedAt: links.length ? links[0].lastEvaluatedAt : null,
      },
      recentLinks: links.slice(0, 20),
    };
  }

  private newCounters(): RunCounters {
    return {
      processedCount: 0,
      createdCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      ruleHits: {
        contract_expiry: 0,
        license_compliance: 0,
        policy_overdue_review: 0,
        vulnerability_change: 0,
      },
    };
  }

  private applyOutcome(counters: RunCounters, outcome: Outcome): void {
    if (outcome === 'created') {
      counters.createdCount += 1;
      return;
    }
    counters.updatedCount += 1;
  }

  private classifyRunStatus(counters: RunCounters): string {
    if (counters.errorCount > 0 && counters.createdCount + counters.updatedCount === 0) {
      return 'failed';
    }
    if (counters.errorCount > 0) {
      return 'partial';
    }
    if (counters.processedCount === 0) {
      return 'skipped';
    }
    return 'success';
  }

  private pickLatestRun(first: AutomationRun | null, second: AutomationRun | null): AutomationRun | null {
    if (!first) return second;
    if (!second) return first;
    return first.startedAt.getTime() >= second.startedAt.getTime() ? first : second;
  }

  private startOfDay(value: Date): Date {
    const copy = new Date(value);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private addDays(value: Date, days: number): Date {
    return new Date(value.getTime() + days * 86_400_000);
  }

  private daysUntil(dateValue: Date): number {
    const now = this.startOfDay(new Date());
    const target = this.startOfDay(new Date(dateValue));
    return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
  }

  private isTerminalStatus(status: string | null | undefined, terminal: string[]): boolean {
    const value = (status || '').trim().toLowerCase();
    return terminal.includes(value);
  }

  private priorityForContract(daysRemaining: number): TicketPriority {
    if (daysRemaining <= 0) return TicketPriority.CRITICAL;
    if (daysRemaining <= 14) return TicketPriority.HIGH;
    return TicketPriority.MEDIUM;
  }

  private priorityForLicenseIssue(license: LicenseWithMeta): TicketPriority {
    if (license.computedStatus === 'expired' || license.computedStatus === 'over_allocated') {
      return TicketPriority.CRITICAL;
    }
    if ((license.daysRemaining ?? 999) <= 14) return TicketPriority.HIGH;
    return TicketPriority.MEDIUM;
  }

  private findingSeverityForPolicy(policy: Policy): string {
    const level = (policy.riskLevel || '').toLowerCase();
    if (level === 'high') return 'high';
    if (level === 'low') return 'low';
    return 'medium';
  }

  private async executeRun(trigger: string, tenantId?: string): Promise<AutomationRunResult> {
    const startedAt = new Date();
    if (this.running) {
      return {
        runId: null,
        status: 'skipped',
        trigger,
        tenantId: tenantId ?? null,
        processedCount: 0,
        createdCount: 0,
        updatedCount: 0,
        skippedCount: 1,
        errorCount: 0,
        durationMs: 0,
        startedAt,
        completedAt: startedAt,
        ruleHits: this.newCounters().ruleHits,
        message: 'Automation runner is already active',
      };
    }

    this.running = true;
    const run = await this.runRepo.save(
      this.runRepo.create({
        tenantId: tenantId ?? null,
        trigger,
        status: 'running',
        startedAt,
      }),
    );

    const counters = this.newCounters();

    try {
      const tenantIds = tenantId
        ? [tenantId]
        : (await this.tenantService.findAllActive()).map((tenant) => tenant.id);

      if (!tenantIds.length) {
        counters.skippedCount += 1;
      }

      for (const currentTenantId of tenantIds) {
        await this.processContractExpiry(currentTenantId, counters);
        await this.processLicenseCompliance(currentTenantId, counters);
        await this.processPolicyOverdueReviews(currentTenantId, counters);
        await this.processSecurityVulnerabilities(currentTenantId, counters);
      }

      const completedAt = new Date();
      run.status = this.classifyRunStatus(counters);
      run.completedAt = completedAt;
      run.processedCount = counters.processedCount;
      run.createdCount = counters.createdCount;
      run.updatedCount = counters.updatedCount;
      run.skippedCount = counters.skippedCount;
      run.errorCount = counters.errorCount;
      run.details = {
        tenantScope: tenantId ?? 'all',
        ...counters.ruleHits,
      };
      await this.runRepo.save(run);

      const durationMs = completedAt.getTime() - startedAt.getTime();
      this.logger.log(
        `Automation run ${run.id} finished: status=${run.status}, processed=${counters.processedCount}, created=${counters.createdCount}, updated=${counters.updatedCount}, errors=${counters.errorCount}, durationMs=${durationMs}`,
      );

      return {
        runId: run.id,
        status: run.status,
        trigger,
        tenantId: run.tenantId,
        processedCount: counters.processedCount,
        createdCount: counters.createdCount,
        updatedCount: counters.updatedCount,
        skippedCount: counters.skippedCount,
        errorCount: counters.errorCount,
        durationMs,
        startedAt,
        completedAt,
        ruleHits: counters.ruleHits,
      };
    } catch (error: unknown) {
      const completedAt = new Date();
      run.status = 'failed';
      run.completedAt = completedAt;
      run.errorCount = counters.errorCount + 1;
      run.processedCount = counters.processedCount;
      run.createdCount = counters.createdCount;
      run.updatedCount = counters.updatedCount;
      run.skippedCount = counters.skippedCount;
      run.details = {
        tenantScope: tenantId ?? 'all',
        ...counters.ruleHits,
        error: error instanceof Error ? error.message : 'Unexpected automation error',
      };
      await this.runRepo.save(run);
      this.logger.error(`Automation run ${run.id} failed`, error instanceof Error ? error.stack : undefined);

      return {
        runId: run.id,
        status: 'failed',
        trigger,
        tenantId: run.tenantId,
        processedCount: counters.processedCount,
        createdCount: counters.createdCount,
        updatedCount: counters.updatedCount,
        skippedCount: counters.skippedCount,
        errorCount: run.errorCount,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        startedAt,
        completedAt,
        ruleHits: counters.ruleHits,
        message: error instanceof Error ? error.message : 'Unexpected automation error',
      };
    } finally {
      this.running = false;
    }
  }

  private async processContractExpiry(tenantId: string, counters: RunCounters): Promise<void> {
    const contracts = await this.vendorsContractsService.listContracts(tenantId, 'active');
    for (const contract of contracts) {
      if (!contract.endDate) continue;

      const daysRemaining = this.daysUntil(contract.endDate);
      const noticeDays = Math.max(1, Number(contract.renewalNoticeDays || CONTRACT_NOTICE_FALLBACK_DAYS));
      if (daysRemaining > noticeDays) continue;

      counters.processedCount += 1;
      counters.ruleHits.contract_expiry += 1;

      try {
        const isExpired = daysRemaining < 0;
        const owner =
          contract.owner ||
          contract.vendor?.contactEmail ||
          contract.vendor?.contactPerson ||
          null;
        const assignee = owner ?? undefined;
        const stateText = isExpired
          ? `expired ${Math.abs(daysRemaining)} day(s) ago`
          : `expires in ${daysRemaining} day(s)`;
        const linkKey: LinkKey = {
          automationType: 'contract_expiry',
          sourceType: 'vendor_contract',
          sourceId: contract.id,
        };

        const riskTitle = `Vendor contract ${isExpired ? 'expired' : 'expiring'}: ${contract.title}`;
        const riskDescription = [
          `Contract ${stateText}.`,
          contract.contractNumber ? `Contract number: ${contract.contractNumber}.` : null,
          contract.vendor?.name ? `Vendor: ${contract.vendor.name}.` : null,
        ]
          .filter(Boolean)
          .join(' ');
        const riskLikelihood = isExpired ? 5 : daysRemaining <= 14 ? 4 : 3;
        const riskOutcome = await this.ensureRiskRecord(
          tenantId,
          linkKey,
          {
            title: riskTitle,
            description: riskDescription,
            domain: 'vendor_management',
            likelihood: riskLikelihood,
            impact: 4,
            status: 'open',
            owner,
            mitigation: 'Prepare renewal, renegotiation, or replacement supplier action.',
            reviewFrequency: 'weekly',
            nextReviewDate: this.addDays(new Date(), 7),
            complianceArea: 'vendor_contracts',
          },
          {
            title: riskTitle,
            description: riskDescription,
            domain: 'vendor_management',
            likelihood: riskLikelihood,
            impact: 4,
            owner,
            mitigation: 'Prepare renewal, renegotiation, or replacement supplier action.',
            reviewFrequency: 'weekly',
            nextReviewDate: this.addDays(new Date(), 7),
            complianceArea: 'vendor_contracts',
          },
          riskTitle,
        );
        this.applyOutcome(counters, riskOutcome);

        const ticketTitle = `Contract action required: ${contract.title}`;
        const ticketDescription = `${stateText}. Review renewal path, approvals, and continuity impact.`;
        const ticketOutcome = await this.ensureTicketRecord(
          tenantId,
          linkKey,
          {
            title: ticketTitle,
            description: ticketDescription,
            requestType: RequestType.SERVICE_REQUEST,
            category: 'Vendor Contracts',
            priority: this.priorityForContract(daysRemaining),
            status: TicketStatus.OPEN,
            reportedBy: AUTOMATION_REPORTER,
            assignedTo: assignee,
            dueDate: contract.endDate,
          },
          {
            title: ticketTitle,
            description: ticketDescription,
            requestType: RequestType.SERVICE_REQUEST,
            category: 'Vendor Contracts',
            priority: this.priorityForContract(daysRemaining),
            reportedBy: AUTOMATION_REPORTER,
            assignedTo: assignee,
            dueDate: contract.endDate,
          },
          ticketTitle,
        );
        this.applyOutcome(counters, ticketOutcome);
      } catch (error: unknown) {
        counters.errorCount += 1;
        this.logger.warn(
          `Contract automation failed for tenant=${tenantId}, contract=${contract.id}: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
    }
  }

  private async processLicenseCompliance(tenantId: string, counters: RunCounters): Promise<void> {
    const licenses = await this.licensesService.findAll(tenantId);
    for (const license of licenses) {
      const issues: string[] = [];

      if (license.computedStatus === 'over_allocated') {
        issues.push(`Used seats (${license.usedSeats}) exceed purchased seats (${license.totalSeats})`);
      }
      if (license.computedStatus === 'expired') {
        issues.push(`License expired ${Math.abs(license.daysRemaining ?? 0)} day(s) ago`);
      }
      if (license.computedStatus === 'expiring_critical') {
        issues.push(`License expires in ${license.daysRemaining ?? 0} day(s)`);
      }

      if (!issues.length) continue;

      counters.processedCount += 1;
      counters.ruleHits.license_compliance += 1;

      try {
        const owner = license.ictOwner || license.businessOwner || null;
        const assignee = owner ?? undefined;
        const expiresAt =
          license.expiryDate && (license.daysRemaining == null || license.daysRemaining <= LICENSE_TICKET_WINDOW_DAYS)
            ? new Date(license.expiryDate)
            : null;
        const linkKey: LinkKey = {
          automationType: 'license_compliance',
          sourceType: 'software_license',
          sourceId: license.id,
        };

        const critical =
          license.computedStatus === 'expired' || license.computedStatus === 'over_allocated';
        const riskTitle = `License compliance risk: ${license.softwareName}`;
        const riskDescription = `${issues.join('. ')}. Vendor: ${license.vendor || license.vendorName || 'Unknown'}.`;
        const riskOutcome = await this.ensureRiskRecord(
          tenantId,
          linkKey,
          {
            title: riskTitle,
            description: riskDescription,
            domain: 'software_licensing',
            likelihood: critical ? 5 : 4,
            impact: 4,
            status: 'open',
            owner,
            mitigation: 'Review true-up, procurement, and renewal actions.',
            reviewFrequency: 'weekly',
            nextReviewDate: this.addDays(new Date(), 7),
            complianceArea: 'software_license_management',
          },
          {
            title: riskTitle,
            description: riskDescription,
            domain: 'software_licensing',
            likelihood: critical ? 5 : 4,
            impact: 4,
            owner,
            mitigation: 'Review true-up, procurement, and renewal actions.',
            reviewFrequency: 'weekly',
            nextReviewDate: this.addDays(new Date(), 7),
            complianceArea: 'software_license_management',
          },
          riskTitle,
        );
        this.applyOutcome(counters, riskOutcome);

        const ticketTitle = `License action required: ${license.softwareName}`;
        const ticketDescription = `${issues.join('. ')}. Start remediation and ownership confirmation.`;
        const ticketOutcome = await this.ensureTicketRecord(
          tenantId,
          linkKey,
          {
            title: ticketTitle,
            description: ticketDescription,
            requestType: RequestType.SERVICE_REQUEST,
            category: 'Software Licensing',
            priority: this.priorityForLicenseIssue(license),
            status: TicketStatus.OPEN,
            reportedBy: AUTOMATION_REPORTER,
            assignedTo: assignee,
            dueDate: expiresAt || this.addDays(new Date(), 14),
          },
          {
            title: ticketTitle,
            description: ticketDescription,
            requestType: RequestType.SERVICE_REQUEST,
            category: 'Software Licensing',
            priority: this.priorityForLicenseIssue(license),
            reportedBy: AUTOMATION_REPORTER,
            assignedTo: assignee,
            dueDate: expiresAt || this.addDays(new Date(), 14),
          },
          ticketTitle,
        );
        this.applyOutcome(counters, ticketOutcome);
      } catch (error: unknown) {
        counters.errorCount += 1;
        this.logger.warn(
          `License automation failed for tenant=${tenantId}, license=${license.id}: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
    }
  }

  private async processPolicyOverdueReviews(tenantId: string, counters: RunCounters): Promise<void> {
    const overduePolicies = await this.policiesService.getOverdueForReview(tenantId);
    for (const policy of overduePolicies) {
      counters.processedCount += 1;
      counters.ruleHits.policy_overdue_review += 1;

      try {
        const reviewDate = policy.nextReviewDue ? new Date(policy.nextReviewDue) : null;
        const daysOverdue = reviewDate ? Math.max(1, -this.daysUntil(reviewDate)) : 1;
        const findingTitle = `Policy overdue for review: ${policy.title}`;
        const description = `Policy review is overdue by ${daysOverdue} day(s). Complete review and approval workflow.`;
        const owner = policy.ictOwner || policy.responsibleOwner || null;
        const linkKey: LinkKey = {
          automationType: 'policy_overdue_review',
          sourceType: 'policy',
          sourceId: policy.id,
        };

        const outcome = await this.ensureFindingRecord(
          tenantId,
          linkKey,
          {
            title: findingTitle,
            description,
            source: 'policy-governance',
            severity: this.findingSeverityForPolicy(policy),
            status: 'open',
            owner,
            dueDate: this.addDays(new Date(), 14),
            correctiveAction: 'Review policy content, obtain approval, and publish latest version.',
          },
          {
            title: findingTitle,
            description,
            source: 'policy-governance',
            severity: this.findingSeverityForPolicy(policy),
            owner,
            dueDate: this.addDays(new Date(), 14),
            correctiveAction: 'Review policy content, obtain approval, and publish latest version.',
          },
          findingTitle,
        );
        this.applyOutcome(counters, outcome);
      } catch (error: unknown) {
        counters.errorCount += 1;
        this.logger.warn(
          `Policy automation failed for tenant=${tenantId}, policy=${policy.id}: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
    }
  }

  private async processSecurityVulnerabilities(tenantId: string, counters: RunCounters): Promise<void> {
    const vulnerabilities = await this.cybersecurityService.findVulnerabilities(tenantId);
    for (const vulnerability of vulnerabilities) {
      if (!this.isVulnerabilityInScope(vulnerability)) continue;

      counters.processedCount += 1;
      counters.ruleHits.vulnerability_change += 1;

      try {
        const highCritical = vulnerability.severity === SeverityLevel.CRITICAL;
        const targetDate = vulnerability.targetRemediationDate
          ? new Date(vulnerability.targetRemediationDate)
          : this.addDays(new Date(), highCritical ? 7 : 14);
        const linkKey: LinkKey = {
          automationType: 'vulnerability_change',
          sourceType: 'vulnerability',
          sourceId: vulnerability.id,
        };

        const changeTitle = `Security remediation change: ${vulnerability.title}`;
        const changeDescription = [
          vulnerability.cveId ? `Reference: ${vulnerability.cveId}.` : null,
          vulnerability.affectedComponent ? `Component: ${vulnerability.affectedComponent}.` : null,
          `Severity: ${vulnerability.severity}.`,
          `Status: ${vulnerability.status}.`,
        ]
          .filter(Boolean)
          .join(' ');

        const outcome = await this.ensureChangeRecord(
          tenantId,
          linkKey,
          {
            title: changeTitle,
            description: changeDescription,
            category: 'security_remediation',
            riskLevel: highCritical ? 'critical' : 'high',
            impactLevel: highCritical ? 'high' : 'medium',
            status: 'requested',
            requestedBy: AUTOMATION_REPORTER,
            plannedStart: new Date(),
            plannedEnd: targetDate,
            outageExpected: true,
            businessApproval: false,
            rollbackPlan: 'Maintain snapshots and tested rollback script before deployment.',
            testPlan: 'Run patch verification and post-change security validation.',
            implementationNotes: `Auto-generated from vulnerability ${vulnerability.cveId || vulnerability.id}.`,
          },
          {
            title: changeTitle,
            description: changeDescription,
            category: 'security_remediation',
            riskLevel: highCritical ? 'critical' : 'high',
            impactLevel: highCritical ? 'high' : 'medium',
            requestedBy: AUTOMATION_REPORTER,
            plannedStart: new Date(),
            plannedEnd: targetDate,
            outageExpected: true,
            rollbackPlan: 'Maintain snapshots and tested rollback script before deployment.',
            testPlan: 'Run patch verification and post-change security validation.',
            implementationNotes: `Auto-generated from vulnerability ${vulnerability.cveId || vulnerability.id}.`,
          },
          changeTitle,
        );
        this.applyOutcome(counters, outcome);
      } catch (error: unknown) {
        counters.errorCount += 1;
        this.logger.warn(
          `Vulnerability automation failed for tenant=${tenantId}, vulnerability=${vulnerability.id}: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
    }
  }

  private isVulnerabilityInScope(vulnerability: Vulnerability): boolean {
    const highSeverity =
      vulnerability.severity === SeverityLevel.CRITICAL ||
      vulnerability.severity === SeverityLevel.HIGH;
    if (!highSeverity) return false;
    const closed =
      vulnerability.status === VulnerabilityStatus.PATCHED ||
      vulnerability.status === VulnerabilityStatus.MITIGATED ||
      vulnerability.status === VulnerabilityStatus.WONT_FIX;
    return !closed;
  }

  private async findLink(
    tenantId: string,
    key: LinkKey,
    targetType: AutomationTargetType,
  ): Promise<AutomationLink | null> {
    return this.linkRepo.findOne({
      where: {
        tenantId,
        automationType: key.automationType,
        sourceType: key.sourceType,
        sourceId: key.sourceId,
        targetType,
      },
    });
  }

  private async upsertLink(
    tenantId: string,
    key: LinkKey,
    targetType: AutomationTargetType,
    targetId: string,
    notes: string,
  ): Promise<void> {
    const now = new Date();
    const existing = await this.findLink(tenantId, key, targetType);
    if (existing) {
      existing.targetId = targetId;
      existing.status = 'active';
      existing.lastEvaluatedAt = now;
      existing.notes = notes;
      await this.linkRepo.save(existing);
      return;
    }

    const created = this.linkRepo.create({
      tenantId,
      automationType: key.automationType,
      sourceType: key.sourceType,
      sourceId: key.sourceId,
      targetType,
      targetId,
      status: 'active',
      lastEvaluatedAt: now,
      notes,
    });
    await this.linkRepo.save(created);
  }

  private async ensureRiskRecord(
    tenantId: string,
    key: LinkKey,
    createData: Partial<RiskRegisterItem>,
    updateData: Partial<RiskRegisterItem>,
    notes: string,
  ): Promise<Outcome> {
    const link = await this.findLink(tenantId, key, 'risk');
    let existing: RiskRegisterItem | null = null;
    if (link?.targetId) {
      try {
        existing = await this.riskComplianceService.getRisk(tenantId, link.targetId);
      } catch {
        existing = null;
      }
    }

    if (!existing || this.isTerminalStatus(existing.status, ['closed', 'accepted', 'resolved', 'retired'])) {
      const created = await this.riskComplianceService.createRisk(tenantId, createData);
      await this.upsertLink(tenantId, key, 'risk', created.id, notes);
      return 'created';
    }

    await this.riskComplianceService.updateRisk(tenantId, existing.id, updateData);
    await this.upsertLink(tenantId, key, 'risk', existing.id, notes);
    return 'updated';
  }

  private async ensureFindingRecord(
    tenantId: string,
    key: LinkKey,
    createData: Partial<AuditFinding>,
    updateData: Partial<AuditFinding>,
    notes: string,
  ): Promise<Outcome> {
    const link = await this.findLink(tenantId, key, 'finding');
    let existing: AuditFinding | null = null;
    if (link?.targetId) {
      try {
        existing = await this.riskComplianceService.getFinding(tenantId, link.targetId);
      } catch {
        existing = null;
      }
    }

    if (!existing || this.isTerminalStatus(existing.status, ['closed', 'resolved'])) {
      const created = await this.riskComplianceService.createFinding(tenantId, createData);
      await this.upsertLink(tenantId, key, 'finding', created.id, notes);
      return 'created';
    }

    await this.riskComplianceService.updateFinding(tenantId, existing.id, updateData);
    await this.upsertLink(tenantId, key, 'finding', existing.id, notes);
    return 'updated';
  }

  private async ensureTicketRecord(
    tenantId: string,
    key: LinkKey,
    createData: Partial<ServiceTicket>,
    updateData: Partial<ServiceTicket>,
    notes: string,
  ): Promise<Outcome> {
    const link = await this.findLink(tenantId, key, 'ticket');
    let existing: ServiceTicket | null = null;
    if (link?.targetId) {
      try {
        existing = await this.serviceDeskService.findTicket(tenantId, link.targetId);
      } catch {
        existing = null;
      }
    }

    if (
      !existing ||
      this.isTerminalStatus(existing.status, [TicketStatus.CLOSED, TicketStatus.RESOLVED])
    ) {
      const created = await this.serviceDeskService.createTicket(tenantId, createData);
      await this.upsertLink(tenantId, key, 'ticket', created.id, notes);
      return 'created';
    }

    await this.serviceDeskService.updateTicket(tenantId, existing.id, updateData);
    await this.upsertLink(tenantId, key, 'ticket', existing.id, notes);
    return 'updated';
  }

  private async ensureChangeRecord(
    tenantId: string,
    key: LinkKey,
    createData: Partial<ChangeRequest>,
    updateData: Partial<ChangeRequest>,
    notes: string,
  ): Promise<Outcome> {
    const link = await this.findLink(tenantId, key, 'change');
    let existing: ChangeRequest | null = null;
    if (link?.targetId) {
      try {
        existing = await this.changeManagementService.getChange(tenantId, link.targetId);
      } catch {
        existing = null;
      }
    }

    if (!existing || this.isTerminalStatus(existing.status, ['closed', 'rejected'])) {
      const created = await this.changeManagementService.createChange(tenantId, createData);
      await this.upsertLink(tenantId, key, 'change', created.id, notes);
      return 'created';
    }

    await this.changeManagementService.updateChange(tenantId, existing.id, updateData);
    await this.upsertLink(tenantId, key, 'change', existing.id, notes);
    return 'updated';
  }
}
