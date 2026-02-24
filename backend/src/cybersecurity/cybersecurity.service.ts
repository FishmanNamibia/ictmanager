import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecurityIncident, IncidentSeverity, IncidentStatus, IctRisk, RiskLevel, RiskStatus, Vulnerability, VulnerabilityStatus, SeverityLevel, AccessReview, AccessReviewStatus, SecurityAuditEvidence, AuditType } from './entities';

@Injectable()
export class CybersecurityService {
  constructor(
    @InjectRepository(SecurityIncident)
    private readonly incidentRepo: Repository<SecurityIncident>,
    @InjectRepository(IctRisk)
    private readonly riskRepo: Repository<IctRisk>,
    @InjectRepository(Vulnerability)
    private readonly vulnRepo: Repository<Vulnerability>,
    @InjectRepository(AccessReview)
    private readonly accessReviewRepo: Repository<AccessReview>,
    @InjectRepository(SecurityAuditEvidence)
    private readonly auditEvidenceRepo: Repository<SecurityAuditEvidence>,
  ) {}

  // Security Incident CRUD
  async createIncident(tenantId: string, data: Partial<SecurityIncident>): Promise<SecurityIncident> {
    const incident = this.incidentRepo.create({ ...data, tenantId });
    return this.incidentRepo.save(incident);
  }

  async findIncidents(tenantId: string, status?: IncidentStatus): Promise<SecurityIncident[]> {
    const where: any = { tenantId };
    if (status) where.status = status;
    return this.incidentRepo.find({ where, order: { dateReported: 'DESC' }, relations: ['evidence'] });
  }

  async findIncident(tenantId: string, id: string): Promise<SecurityIncident> {
    const incident = await this.incidentRepo.findOne({
      where: { id, tenantId },
      relations: ['evidence'],
    });
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }

  async updateIncident(tenantId: string, id: string, data: Partial<SecurityIncident>): Promise<SecurityIncident> {
    await this.findIncident(tenantId, id);
    await this.incidentRepo.update({ id, tenantId }, data as any);
    return this.findIncident(tenantId, id);
  }

  async deleteIncident(tenantId: string, id: string): Promise<void> {
    await this.findIncident(tenantId, id);
    await this.incidentRepo.delete({ id, tenantId });
  }

  // ICT Risk CRUD
  async createRisk(tenantId: string, data: Partial<IctRisk>): Promise<IctRisk> {
    const risk = this.riskRepo.create({ ...data, tenantId });
    return this.riskRepo.save(risk);
  }

  async findRisks(tenantId: string, status?: RiskStatus): Promise<IctRisk[]> {
    const where: any = { tenantId };
    if (status) where.status = status;
    return this.riskRepo.find({ where, order: { overallRisk: 'DESC', createdAt: 'DESC' } });
  }

  async findRisk(tenantId: string, id: string): Promise<IctRisk> {
    const risk = await this.riskRepo.findOne({ where: { id, tenantId } });
    if (!risk) throw new NotFoundException('Risk not found');
    return risk;
  }

  async updateRisk(tenantId: string, id: string, data: Partial<IctRisk>): Promise<IctRisk> {
    await this.findRisk(tenantId, id);
    await this.riskRepo.update({ id, tenantId }, data as any);
    return this.findRisk(tenantId, id);
  }

  async deleteRisk(tenantId: string, id: string): Promise<void> {
    await this.findRisk(tenantId, id);
    await this.riskRepo.delete({ id, tenantId });
  }

  // Vulnerability CRUD
  async createVulnerability(tenantId: string, data: Partial<Vulnerability>): Promise<Vulnerability> {
    const vuln = this.vulnRepo.create({ ...data, tenantId });
    return this.vulnRepo.save(vuln);
  }

  async findVulnerabilities(tenantId: string, status?: VulnerabilityStatus): Promise<Vulnerability[]> {
    const where: any = { tenantId };
    if (status) where.status = status;
    return this.vulnRepo.find({ where, order: { severity: 'DESC', discoveredDate: 'DESC' } });
  }

  async findVulnerability(tenantId: string, id: string): Promise<Vulnerability> {
    const vuln = await this.vulnRepo.findOne({ where: { id, tenantId } });
    if (!vuln) throw new NotFoundException('Vulnerability not found');
    return vuln;
  }

  async updateVulnerability(tenantId: string, id: string, data: Partial<Vulnerability>): Promise<Vulnerability> {
    await this.findVulnerability(tenantId, id);
    await this.vulnRepo.update({ id, tenantId }, data as any);
    return this.findVulnerability(tenantId, id);
  }

  async deleteVulnerability(tenantId: string, id: string): Promise<void> {
    await this.findVulnerability(tenantId, id);
    await this.vulnRepo.delete({ id, tenantId });
  }

  // Access Review CRUD
  async createAccessReview(tenantId: string, data: Partial<AccessReview>): Promise<AccessReview> {
    const review = this.accessReviewRepo.create({ ...data, tenantId });
    return this.accessReviewRepo.save(review);
  }

  async findAccessReviews(tenantId: string, status?: AccessReviewStatus): Promise<AccessReview[]> {
    const where: any = { tenantId };
    if (status) where.status = status;
    return this.accessReviewRepo.find({ where, order: { dueDate: 'ASC' } });
  }

  async findAccessReview(tenantId: string, id: string): Promise<AccessReview> {
    const review = await this.accessReviewRepo.findOne({ where: { id, tenantId } });
    if (!review) throw new NotFoundException('Access review not found');
    return review;
  }

  async updateAccessReview(tenantId: string, id: string, data: Partial<AccessReview>): Promise<AccessReview> {
    await this.findAccessReview(tenantId, id);
    await this.accessReviewRepo.update({ id, tenantId }, data as any);
    return this.findAccessReview(tenantId, id);
  }

  async deleteAccessReview(tenantId: string, id: string): Promise<void> {
    await this.findAccessReview(tenantId, id);
    await this.accessReviewRepo.delete({ id, tenantId });
  }

  // Audit Evidence
  async logAuditEvidence(tenantId: string, data: Partial<SecurityAuditEvidence>): Promise<SecurityAuditEvidence> {
    const evidence = this.auditEvidenceRepo.create({ ...data, tenantId });
    return this.auditEvidenceRepo.save(evidence);
  }

  async findAuditEvidence(tenantId: string, filter?: { auditType?: AuditType; userId?: string; days?: number }): Promise<SecurityAuditEvidence[]> {
    const qb = this.auditEvidenceRepo.createQueryBuilder('e').where('e.tenant_id = :tenantId', { tenantId });
    if (filter?.auditType) qb.andWhere('e.audit_type = :auditType', { auditType: filter.auditType });
    if (filter?.userId) qb.andWhere('e.user_id = :userId', { userId: filter.userId });
    if (filter?.days) {
      qb.andWhere('e.created_at >= NOW() - INTERVAL :days DAY', { days: filter.days });
    }
    qb.orderBy('e.created_at', 'DESC');
    return qb.getMany();
  }

  // Aggregated Dashboard Stats
  async getSecurityDashboardStats(tenantId: string): Promise<{
    incidentStats: {
      total: number;
      byStatus: Record<string, number>;
      bySeverity: Record<string, number>;
      activeIncidents: number;
    };
    riskStats: {
      total: number;
      byLevel: Record<string, number>;
      criticalCount: number;
      overallRiskTrend: string;
    };
    vulnerabilityStats: {
      total: number;
      bySeverity: Record<string, number>;
      unpatchedCount: number;
      overduePatchCount: number;
    };
    accessReviewStats: {
      total: number;
      byStatus: Record<string, number>;
      overdueCount: number;
      nextDueInDays: number | null;
    };
  }> {
    const incidents = await this.findIncidents(tenantId);
    const risks = await this.findRisks(tenantId);
    const vulnerabilities = await this.findVulnerabilities(tenantId);
    const accessReviews = await this.findAccessReviews(tenantId);

    const incidentsByStatus = incidents.reduce((acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const incidentsBySeverity = incidents.reduce((acc, i) => {
      acc[i.severity] = (acc[i.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const risksByLevel = risks.reduce((acc, r) => {
      acc[r.overallRisk] = (acc[r.overallRisk] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const vulnBySeverity = vulnerabilities.reduce((acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const accessReviewsByStatus = accessReviews.reduce((acc, ar) => {
      acc[ar.status] = (acc[ar.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const overdueReviews = accessReviews.filter((ar) => ar.dueDate < new Date()).length;
    const nextDueReview = accessReviews.filter((ar) => ar.dueDate > new Date()).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];
    const daysToNextDue = nextDueReview ? Math.ceil((nextDueReview.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

    return {
      incidentStats: {
        total: incidents.length,
        byStatus: incidentsByStatus,
        bySeverity: incidentsBySeverity,
        activeIncidents: incidents.filter((i) => [IncidentStatus.INVESTIGATING, IncidentStatus.CONTAINED].includes(i.status)).length,
      },
      riskStats: {
        total: risks.length,
        byLevel: risksByLevel,
        criticalCount: risks.filter((r) => r.overallRisk === RiskLevel.CRITICAL).length,
        overallRiskTrend: risks.length > 0 ? 'monitoring' : 'baseline',
      },
      vulnerabilityStats: {
        total: vulnerabilities.length,
        bySeverity: vulnBySeverity,
        unpatchedCount: vulnerabilities.filter((v) => ![VulnerabilityStatus.PATCHED, VulnerabilityStatus.MITIGATED].includes(v.status)).length,
        overduePatchCount: vulnerabilities.filter((v) => v.targetRemediationDate && v.targetRemediationDate < new Date() && ![VulnerabilityStatus.PATCHED, VulnerabilityStatus.MITIGATED].includes(v.status)).length,
      },
      accessReviewStats: {
        total: accessReviews.length,
        byStatus: accessReviewsByStatus,
        overdueCount: overdueReviews,
        nextDueInDays: daysToNextDue,
      },
    };
  }
}
