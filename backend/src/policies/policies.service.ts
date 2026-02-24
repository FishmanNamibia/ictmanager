import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Policy, PolicyStatus } from './policy.entity';
import { PolicyCategory } from './policy-category.entity';
import { PolicyAcknowledgement } from './policy-ack.entity';
import { PolicyVersion } from './policy-version.entity';
import { PolicyWorkflowEvent } from './policy-workflow-event.entity';
import { PolicyAcknowledgementScope } from './policy-ack-scope.entity';
import { UsersService } from '../users/users.service';
import { Application } from '../applications/application.entity';
import { Asset } from '../assets/asset.entity';
import { SoftwareLicense } from '../assets/software-license.entity';
import { User } from '../users/user.entity';

type ActorInput = {
  userId?: string | null;
  name?: string | null;
};

type ScopeInput = {
  role?: string | null;
  department?: string | null;
};

type PolicyMutationInput = {
  title?: string;
  policyType?: Policy['policyType'];
  policyDocumentType?: Policy['policyDocumentType'];
  status?: PolicyStatus;
  categoryId?: string | null;
  responsibleOwner?: string | null;
  ictOwner?: string | null;
  approvalAuthority?: string | null;
  version?: string | null;
  approvalDate?: string | Date | null;
  effectiveDate?: string | Date | null;
  reviewFrequency?: string | null;
  riskLevel?: Policy['riskLevel'] | null;
  attachments?: Array<{ name: string; url: string }> | null;
  lastReviewDate?: string | Date | null;
  nextReviewDue?: string | Date | null;
  documentUrl?: string | null;
  notes?: string | null;
};

function norm(v?: string | null): string {
  return (v ?? '').trim().toLowerCase();
}

const DEFAULT_POLICY_CATEGORIES: Array<{ name: string; slug: string; description: string }> = [
  { name: 'Governance & Management', slug: 'governance-management', description: 'ICT governance, planning, change and project control policies.' },
  { name: 'Information Security', slug: 'information-security', description: 'Security controls, access, acceptable use and incident response policies.' },
  { name: 'Data & Information Management', slug: 'data-information-management', description: 'Data protection, classification, retention, sharing, and backup policies.' },
  { name: 'Infrastructure & Operations', slug: 'infrastructure-operations', description: 'Infrastructure, assets, software, patching, network and cloud policies.' },
  { name: 'Business Continuity', slug: 'business-continuity', description: 'Disaster recovery, continuity and backup testing policies.' },
  { name: 'Human & User-related', slug: 'human-user-related', description: 'User access, BYOD, email and internet usage policies.' },
];

@Injectable()
export class PoliciesService {
  constructor(
    @InjectRepository(Policy)
    private readonly repo: Repository<Policy>,
    @InjectRepository(PolicyCategory)
    private readonly categoryRepo: Repository<PolicyCategory>,
    @InjectRepository(PolicyAcknowledgement)
    private readonly ackRepo: Repository<PolicyAcknowledgement>,
    @InjectRepository(PolicyVersion)
    private readonly versionRepo: Repository<PolicyVersion>,
    @InjectRepository(PolicyWorkflowEvent)
    private readonly workflowRepo: Repository<PolicyWorkflowEvent>,
    @InjectRepository(PolicyAcknowledgementScope)
    private readonly scopeRepo: Repository<PolicyAcknowledgementScope>,
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(SoftwareLicense)
    private readonly licenseRepo: Repository<SoftwareLicense>,
    private readonly usersService: UsersService,
  ) {}

  private parseOptionalDate(value: string | Date | null | undefined, field: string): Date | null | undefined {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${field} must be a valid date`);
    }
    return parsed;
  }

  private normalizePolicyInput(data: PolicyMutationInput): Partial<Policy> & { categoryId?: string | null } {
    const normalized: Partial<Policy> & { categoryId?: string | null } = {};

    if ('title' in data) normalized.title = data.title;
    if ('policyType' in data) normalized.policyType = data.policyType;
    if ('policyDocumentType' in data) normalized.policyDocumentType = data.policyDocumentType;
    if ('status' in data) normalized.status = data.status;
    if ('categoryId' in data) normalized.categoryId = data.categoryId;
    if ('responsibleOwner' in data) normalized.responsibleOwner = data.responsibleOwner ?? null;
    if ('ictOwner' in data) normalized.ictOwner = data.ictOwner ?? null;
    if ('approvalAuthority' in data) normalized.approvalAuthority = data.approvalAuthority ?? null;
    if ('version' in data) normalized.version = data.version ?? null;
    if ('reviewFrequency' in data) normalized.reviewFrequency = data.reviewFrequency ?? null;
    if ('riskLevel' in data) normalized.riskLevel = data.riskLevel ?? null;
    if ('attachments' in data) normalized.attachments = data.attachments ?? null;
    if ('documentUrl' in data) normalized.documentUrl = data.documentUrl ?? null;
    if ('notes' in data) normalized.notes = data.notes ?? null;

    if ('approvalDate' in data) {
      normalized.approvalDate = this.parseOptionalDate(data.approvalDate, 'approvalDate');
    }
    if ('effectiveDate' in data) {
      normalized.effectiveDate = this.parseOptionalDate(data.effectiveDate, 'effectiveDate');
    }
    if ('lastReviewDate' in data) {
      normalized.lastReviewDate = this.parseOptionalDate(data.lastReviewDate, 'lastReviewDate');
    }
    if ('nextReviewDue' in data) {
      normalized.nextReviewDue = this.parseOptionalDate(data.nextReviewDue, 'nextReviewDue');
    }

    return normalized;
  }

  private async resolveCategory(tenantId: string, data: Partial<Policy> & { categoryId?: string | null }): Promise<Partial<Policy>> {
    const { categoryId, ...rest } = data;
    const payload: Partial<Policy> = { ...rest };
    if (categoryId !== undefined) {
      if (!categoryId) {
        payload.category = null;
      } else {
        const category = await this.categoryRepo.findOne({ where: { id: categoryId, tenantId } });
        if (!category) throw new NotFoundException('Policy category not found');
        payload.category = category;
      }
    }
    return payload;
  }

  private async logWorkflowEvent(
    tenantId: string,
    policyId: string,
    action: string,
    fromStatus: PolicyStatus | null,
    toStatus: PolicyStatus | null,
    actor?: ActorInput,
    comments?: string | null,
  ): Promise<void> {
    const evt = this.workflowRepo.create({
      tenantId,
      policyId,
      action,
      fromStatus,
      toStatus,
      actorUserId: actor?.userId ?? null,
      actorName: actor?.name ?? null,
      comments: comments ?? null,
    });
    await this.workflowRepo.save(evt);
  }

  private getUsersForPolicyScope(allUsers: User[], scopes: PolicyAcknowledgementScope[]): User[] {
    const activeUsers = allUsers.filter((u) => u.active);
    if (!scopes.length) return activeUsers;
    return activeUsers.filter((u) =>
      scopes.some((s) => {
        const roleOk = !s.role || s.role === u.role;
        const deptOk = !s.department || norm(s.department) === norm(u.department);
        return roleOk && deptOk;
      }),
    );
  }

  private async findPolicyForLinks(tenantId: string, id: string): Promise<Policy> {
    const policy = await this.repo.findOne({
      where: { id, tenantId },
      relations: ['applications', 'assets', 'softwareLicenses'],
    });
    if (!policy) throw new NotFoundException('Policy not found');
    return policy;
  }

  async create(tenantId: string, data: PolicyMutationInput, actor?: ActorInput): Promise<Policy> {
    const normalized = this.normalizePolicyInput(data);
    const resolved = await this.resolveCategory(tenantId, normalized);
    const policy = this.repo.create({ ...resolved, tenantId });
    const saved = await this.repo.save(policy);
    await this.logWorkflowEvent(tenantId, saved.id, 'created', null, saved.status, actor, 'Policy created');

    // Create initial version record if metadata already contains version and/or document.
    if (saved.version || saved.documentUrl) {
      await this.addVersion(
        tenantId,
        saved.id,
        {
          versionLabel: saved.version ?? 'v1.0',
          documentUrl: saved.documentUrl ?? undefined,
          changeSummary: 'Initial policy version',
          uploadedBy: actor?.name ?? 'system',
          isCurrent: true,
        },
        actor,
        true,
      );
    }
    return saved;
  }

  async findAll(
    tenantId: string,
    status?: PolicyStatus,
    filters?: { categoryId?: string; riskLevel?: string; overdue?: boolean; search?: string; documentType?: string },
  ): Promise<Policy[]> {
    const qb = this.repo.createQueryBuilder('p').where('p.tenant_id = :tenantId', { tenantId });
    if (status) qb.andWhere('p.status = :status', { status });
    if (filters?.categoryId) qb.andWhere('p.category_id = :categoryId', { categoryId: filters.categoryId });
    if (filters?.riskLevel) qb.andWhere('p.risk_level = :riskLevel', { riskLevel: filters.riskLevel });
    if (filters?.documentType) qb.andWhere('p.policy_document_type = :documentType', { documentType: filters.documentType });
    if (filters?.search?.trim()) {
      const q = `%${filters.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(p.title) LIKE :q OR LOWER(COALESCE(p.responsible_owner, \'\')) LIKE :q OR LOWER(COALESCE(p.ict_owner, \'\')) LIKE :q)',
        { q },
      );
    }
    if (filters?.overdue) qb.andWhere('p.next_review_due IS NOT NULL AND p.next_review_due < CURRENT_DATE');
    return qb.orderBy('p.next_review_due', 'ASC').addOrderBy('p.title', 'ASC').getMany();
  }

  async createCategory(tenantId: string, data: Partial<PolicyCategory>): Promise<PolicyCategory> {
    const cat = this.categoryRepo.create({ ...data, tenantId });
    return this.categoryRepo.save(cat);
  }

  async listCategories(tenantId: string): Promise<PolicyCategory[]> {
    const existing = await this.categoryRepo.find({ where: { tenantId }, order: { name: 'ASC' } });
    if (existing.length) return existing;

    await this.categoryRepo.save(
      DEFAULT_POLICY_CATEGORIES.map((c) =>
        this.categoryRepo.create({
          tenantId,
          name: c.name,
          slug: c.slug,
          description: c.description,
        }),
      ),
    );

    return this.categoryRepo.find({ where: { tenantId }, order: { name: 'ASC' } });
  }

  async acknowledge(tenantId: string, policyId: string, userId: string, ip?: string, userAgent?: string) {
    if (!userId?.trim()) throw new BadRequestException('userId is required');
    const policy = await this.findOne(tenantId, policyId);
    const existing = await this.ackRepo.findOne({ where: { tenantId, policy: { id: policyId }, userId } });
    if (existing) return existing;
    const ack = this.ackRepo.create({ tenantId, policy, userId, ipAddress: ip ?? null, userAgent: userAgent ?? null });
    return this.ackRepo.save(ack);
  }

  async getAcknowledgements(tenantId: string, policyId: string) {
    return this.ackRepo.find({ where: { tenantId, policy: { id: policyId } }, relations: ['policy'] });
  }

  async setAcknowledgementScope(tenantId: string, policyId: string, scopes: ScopeInput[], actor?: ActorInput) {
    await this.findOne(tenantId, policyId);
    await this.scopeRepo.delete({ tenantId, policyId });

    const cleaned = (scopes ?? [])
      .map((s) => ({
        role: s.role?.trim() || null,
        department: s.department?.trim() || null,
      }))
      .filter((s) => s.role || s.department);

    const dedupe = new Set<string>();
    const unique = cleaned.filter((s) => {
      const key = `${s.role ?? ''}::${norm(s.department)}`;
      if (dedupe.has(key)) return false;
      dedupe.add(key);
      return true;
    });

    if (unique.length) {
      await this.scopeRepo.save(unique.map((s) => this.scopeRepo.create({ ...s, tenantId, policyId })));
    }

    await this.logWorkflowEvent(
      tenantId,
      policyId,
      'ack_scope_updated',
      null,
      null,
      actor,
      unique.length ? `Scope entries: ${unique.length}` : 'Scope cleared (all users in tenant)',
    );
    return this.getAcknowledgementScope(tenantId, policyId);
  }

  async getAcknowledgementScope(tenantId: string, policyId: string) {
    await this.findOne(tenantId, policyId);
    return this.scopeRepo.find({ where: { tenantId, policyId }, order: { createdAt: 'ASC' } });
  }

  async addVersion(
    tenantId: string,
    policyId: string,
    data: {
      versionLabel: string;
      documentUrl?: string | null;
      changeSummary?: string | null;
      uploadedBy?: string | null;
      isCurrent?: boolean;
    },
    actor?: ActorInput,
    silentWorkflow = false,
  ) {
    if (!data.versionLabel?.trim()) throw new BadRequestException('versionLabel is required');
    const policy = await this.findOne(tenantId, policyId);
    const makeCurrent = data.isCurrent !== false;

    if (makeCurrent) {
      await this.versionRepo
        .createQueryBuilder()
        .update(PolicyVersion)
        .set({ isCurrent: false })
        .where('tenant_id = :tenantId AND policy_id = :policyId', { tenantId, policyId })
        .execute();
    }

    const version = this.versionRepo.create({
      tenantId,
      policyId,
      versionLabel: data.versionLabel.trim(),
      documentUrl: data.documentUrl ?? null,
      changeSummary: data.changeSummary ?? null,
      uploadedBy: data.uploadedBy ?? actor?.name ?? null,
      isCurrent: makeCurrent,
    });
    const saved = await this.versionRepo.save(version);

    if (makeCurrent) {
      policy.version = saved.versionLabel;
      policy.documentUrl = saved.documentUrl ?? policy.documentUrl;
      await this.repo.save(policy);
    }

    if (!silentWorkflow) {
      await this.logWorkflowEvent(
        tenantId,
        policyId,
        'version_uploaded',
        null,
        null,
        actor,
        `Uploaded version ${saved.versionLabel}`,
      );
    }

    return saved;
  }

  async listVersions(tenantId: string, policyId: string) {
    await this.findOne(tenantId, policyId);
    return this.versionRepo.find({
      where: { tenantId, policyId },
      order: { uploadedAt: 'DESC' },
    });
  }

  async setCurrentVersion(tenantId: string, policyId: string, versionId: string, actor?: ActorInput) {
    const policy = await this.findOne(tenantId, policyId);
    const version = await this.versionRepo.findOne({ where: { id: versionId, tenantId, policyId } });
    if (!version) throw new NotFoundException('Policy version not found');

    await this.versionRepo
      .createQueryBuilder()
      .update(PolicyVersion)
      .set({ isCurrent: false })
      .where('tenant_id = :tenantId AND policy_id = :policyId', { tenantId, policyId })
      .execute();

    version.isCurrent = true;
    await this.versionRepo.save(version);

    policy.version = version.versionLabel;
    policy.documentUrl = version.documentUrl ?? policy.documentUrl;
    await this.repo.save(policy);

    await this.logWorkflowEvent(
      tenantId,
      policyId,
      'version_set_current',
      null,
      null,
      actor,
      `Set current version to ${version.versionLabel}`,
    );

    return version;
  }

  async getWorkflowHistory(tenantId: string, policyId: string) {
    await this.findOne(tenantId, policyId);
    return this.workflowRepo.find({
      where: { tenantId, policyId },
      order: { createdAt: 'DESC' },
    });
  }

  async linkApplication(tenantId: string, policyId: string, applicationId: string) {
    const policy = await this.findPolicyForLinks(tenantId, policyId);
    const app = await this.appRepo.findOne({ where: { id: applicationId, tenantId } });
    if (!app) throw new NotFoundException('Application not found');
    policy.applications = policy.applications ?? [];
    if (!policy.applications.find((a) => a.id === app.id)) policy.applications.push(app);
    return this.repo.save(policy);
  }

  async unlinkApplication(tenantId: string, policyId: string, applicationId: string) {
    const policy = await this.findPolicyForLinks(tenantId, policyId);
    policy.applications = (policy.applications ?? []).filter((a) => a.id !== applicationId);
    return this.repo.save(policy);
  }

  async linkAsset(tenantId: string, policyId: string, assetId: string) {
    const policy = await this.findPolicyForLinks(tenantId, policyId);
    const asset = await this.assetRepo.findOne({ where: { id: assetId, tenantId } });
    if (!asset) throw new NotFoundException('Asset not found');
    policy.assets = policy.assets ?? [];
    if (!policy.assets.find((a) => a.id === asset.id)) policy.assets.push(asset);
    return this.repo.save(policy);
  }

  async unlinkAsset(tenantId: string, policyId: string, assetId: string) {
    const policy = await this.findPolicyForLinks(tenantId, policyId);
    policy.assets = (policy.assets ?? []).filter((a) => a.id !== assetId);
    return this.repo.save(policy);
  }

  async linkLicense(tenantId: string, policyId: string, licenseId: string) {
    const policy = await this.findPolicyForLinks(tenantId, policyId);
    const lic = await this.licenseRepo.findOne({ where: { id: licenseId, tenantId } });
    if (!lic) throw new NotFoundException('License not found');
    policy.softwareLicenses = policy.softwareLicenses ?? [];
    if (!policy.softwareLicenses.find((l) => l.id === lic.id)) policy.softwareLicenses.push(lic);
    return this.repo.save(policy);
  }

  async unlinkLicense(tenantId: string, policyId: string, licenseId: string) {
    const policy = await this.findPolicyForLinks(tenantId, policyId);
    policy.softwareLicenses = (policy.softwareLicenses ?? []).filter((l) => l.id !== licenseId);
    return this.repo.save(policy);
  }

  async getLinkedEntities(tenantId: string, policyId: string) {
    const policy = await this.repo.findOne({
      where: { id: policyId, tenantId },
      relations: ['applications', 'assets', 'softwareLicenses'],
    });
    if (!policy) throw new NotFoundException('Policy not found');
    return { applications: policy.applications || [], assets: policy.assets || [], licenses: policy.softwareLicenses || [] };
  }

  async exportEvidence(tenantId: string, policyId: string) {
    const p = await this.findOne(tenantId, policyId);
    const [acks, links, versions, workflow, scope, unacknowledged, compliance] = await Promise.all([
      this.getAcknowledgements(tenantId, policyId),
      this.getLinkedEntities(tenantId, policyId),
      this.listVersions(tenantId, policyId),
      this.getWorkflowHistory(tenantId, policyId),
      this.getAcknowledgementScope(tenantId, policyId),
      this.getUnacknowledgedUsers(tenantId, policyId),
      this.getComplianceStats(tenantId),
    ]);
    return {
      policy: p,
      linked: links,
      versions,
      workflow,
      acknowledgementScope: scope,
      acknowledgements: acks,
      unacknowledgedUsers: unacknowledged.map((u) => ({ id: u.id, email: u.email, fullName: u.fullName, department: u.department })),
      compliance: compliance.byPolicy.find((bp) => bp.policyId === policyId) ?? null,
    };
  }

  async getComplianceStats(tenantId: string) {
    const [policies, allUsers] = await Promise.all([
      this.findAll(tenantId),
      this.usersService.findAllByTenant(tenantId),
    ]);

    const scopes = await this.scopeRepo.find({ where: { tenantId } });
    const scopesByPolicy = new Map<string, PolicyAcknowledgementScope[]>();
    for (const s of scopes) {
      const list = scopesByPolicy.get(s.policyId) ?? [];
      list.push(s);
      scopesByPolicy.set(s.policyId, list);
    }

    const ackRows = await this.ackRepo
      .createQueryBuilder('a')
      .leftJoin('a.policy', 'p')
      .select('p.id', 'policy_id')
      .addSelect('a.user_id', 'user_id')
      .where('a.tenant_id = :tenantId', { tenantId })
      .getRawMany<{ policy_id: string; user_id: string }>();

    const ackByPolicy = new Map<string, Set<string>>();
    for (const r of ackRows) {
      const set = ackByPolicy.get(r.policy_id) ?? new Set<string>();
      set.add(r.user_id);
      ackByPolicy.set(r.policy_id, set);
    }

    const deptTotals = new Map<string, { required: number; acknowledged: number }>();
    const byPolicy = policies.map((p) => {
      const scopedUsers = this.getUsersForPolicyScope(allUsers, scopesByPolicy.get(p.id) ?? []);
      const ackedSet = ackByPolicy.get(p.id) ?? new Set<string>();
      const requiredUsers = scopedUsers.length;
      const acknowledgedUsers = scopedUsers.filter((u) => ackedSet.has(u.id)).length;
      const compliancePercent = requiredUsers === 0 ? 100 : Math.round((acknowledgedUsers / requiredUsers) * 100);
      const outstandingUsers = Math.max(0, requiredUsers - acknowledgedUsers);

      for (const u of scopedUsers) {
        const dept = u.department?.trim() || 'Unassigned';
        const curr = deptTotals.get(dept) ?? { required: 0, acknowledged: 0 };
        curr.required += 1;
        if (ackedSet.has(u.id)) curr.acknowledged += 1;
        deptTotals.set(dept, curr);
      }

      return {
        policyId: p.id,
        title: p.title,
        category: p.category?.name ?? null,
        status: p.status,
        riskLevel: p.riskLevel ?? null,
        requiredUsers,
        acknowledgedUsers,
        outstandingUsers,
        compliancePercent,
      };
    });

    const overallRequiredUsers = byPolicy.reduce((sum, p) => sum + p.requiredUsers, 0);
    const overallAcknowledgedUsers = byPolicy.reduce((sum, p) => sum + p.acknowledgedUsers, 0);
    const overallCompliancePercent = overallRequiredUsers === 0 ? 100 : Math.round((overallAcknowledgedUsers / overallRequiredUsers) * 100);

    const byDepartment = Array.from(deptTotals.entries())
      .map(([department, v]) => ({
        department,
        requiredUsers: v.required,
        acknowledgedUsers: v.acknowledged,
        compliancePercent: v.required === 0 ? 100 : Math.round((v.acknowledged / v.required) * 100),
      }))
      .sort((a, b) => a.department.localeCompare(b.department));

    // Backwards-compatible shape.
    const ackCounts = byPolicy.map((p) => ({
      policyId: p.policyId,
      title: p.title,
      ackCount: p.acknowledgedUsers,
    }));

    return {
      total: policies.length,
      ackCounts,
      overallRequiredUsers,
      overallAcknowledgedUsers,
      overallCompliancePercent,
      byPolicy,
      byDepartment,
    };
  }

  async approvePolicy(
    tenantId: string,
    id: string,
    approver: string,
    effectiveDate?: Date,
    actor?: ActorInput,
  ) {
    const p = await this.findOne(tenantId, id);
    const prev = p.status;
    p.status = 'approved';
    p.approvalAuthority = approver;
    p.approvalDate = new Date();
    if (effectiveDate) p.effectiveDate = effectiveDate;
    await this.repo.save(p);
    await this.logWorkflowEvent(
      tenantId,
      id,
      'approved',
      prev,
      p.status,
      actor,
      `Approved by ${approver}`,
    );
    return p;
  }

  async retirePolicy(tenantId: string, id: string, actor?: ActorInput) {
    const p = await this.findOne(tenantId, id);
    const prev = p.status;
    p.status = 'retired';
    await this.repo.save(p);
    await this.logWorkflowEvent(tenantId, id, 'retired', prev, p.status, actor, 'Policy retired');
    return p;
  }

  async sendForReview(tenantId: string, id: string, actor?: ActorInput) {
    const p = await this.findOne(tenantId, id);
    const prev = p.status;
    p.status = 'under_review';
    await this.repo.save(p);
    await this.logWorkflowEvent(tenantId, id, 'sent_for_review', prev, p.status, actor, 'Policy sent for review');
    return p;
  }

  /** Policies with next_review_due within `days` from today */
  async getDueInDays(tenantId: string, days = 60) {
    const qb = this.repo
      .createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.next_review_due IS NOT NULL')
      .andWhere('p.next_review_due BETWEEN CURRENT_DATE AND (CURRENT_DATE + :days::int * INTERVAL \'1 day\')', { days })
      .orderBy('p.next_review_due', 'ASC');
    return qb.getMany();
  }

  /** Users in policy scope who have not acknowledged the policy. */
  async getUnacknowledgedUsers(tenantId: string, policyId: string) {
    await this.findOne(tenantId, policyId);
    const [users, scopes, acks] = await Promise.all([
      this.usersService.findAllByTenant(tenantId),
      this.scopeRepo.find({ where: { tenantId, policyId } }),
      this.ackRepo.find({ where: { tenantId, policy: { id: policyId } } }),
    ]);
    const scopedUsers = this.getUsersForPolicyScope(users, scopes);
    const acked = new Set(acks.map((a) => a.userId));
    return scopedUsers.filter((u) => !acked.has(u.id));
  }

  async findOne(tenantId: string, id: string): Promise<Policy> {
    const policy = await this.repo.findOne({ where: { id, tenantId } });
    if (!policy) throw new NotFoundException('Policy not found');
    return policy;
  }

  async update(tenantId: string, id: string, data: PolicyMutationInput, actor?: ActorInput): Promise<Policy> {
    const current = await this.findOne(tenantId, id);
    const normalized = this.normalizePolicyInput(data);
    const resolved = await this.resolveCategory(tenantId, normalized);
    await this.repo.update({ id, tenantId }, resolved as Partial<Policy>);
    const updated = await this.findOne(tenantId, id);
    if (current.status !== updated.status) {
      await this.logWorkflowEvent(
        tenantId,
        id,
        'status_changed',
        current.status,
        updated.status,
        actor,
        `Status changed from ${current.status} to ${updated.status}`,
      );
    }
    return updated;
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id);
    await this.repo.delete({ id, tenantId });
  }

  /** Policies with next_review_due in the past (overdue for review). */
  async getOverdueForReview(tenantId: string): Promise<Policy[]> {
    const qb = this.repo
      .createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.next_review_due IS NOT NULL')
      .andWhere('p.next_review_due < CURRENT_DATE')
      .orderBy('p.next_review_due', 'ASC');
    return qb.getMany();
  }

  /** Count overdue and total for governance dashboard. */
  async getGovernanceStats(tenantId: string): Promise<{
    total: number;
    overdueForReview: number;
    approved: number;
    draft: number;
    expired: number;
    overduePolicies: Array<{ id: string; title: string; nextReviewDue: string }>;
  }> {
    const all = await this.findAll(tenantId);
    const overdue = await this.getOverdueForReview(tenantId);
    const approved = all.filter((p) => p.status === 'approved').length;
    const draft = all.filter((p) => p.status === 'draft').length;
    const expired = all.filter((p) => p.status === 'expired').length;
    return {
      total: all.length,
      overdueForReview: overdue.length,
      approved,
      draft,
      expired,
      overduePolicies: overdue.map((p) => ({
        id: p.id,
        title: p.title,
        nextReviewDue: p.nextReviewDue ? p.nextReviewDue.toISOString().slice(0, 10) : '',
      })),
    };
  }
}
