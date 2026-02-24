import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffProfile } from './staff-profile.entity';
import { StaffSkill } from './staff-skill.entity';
import { StaffCertification } from './staff-certification.entity';
import { SystemAssignment } from './system-assignment.entity';
import { CreateStaffProfileDto } from './dto/create-staff-profile.dto';
import { UpdateStaffProfileDto } from './dto/update-staff-profile.dto';
import { AddSkillDto } from './dto/add-skill.dto';
import { AddCertificationDto } from './dto/add-certification.dto';
import { AddAssignmentDto } from './dto/add-assignment.dto';

export type WorkloadStatus = 'overloaded' | 'high' | 'normal' | 'under_utilised';

export interface EnrichedStaff extends StaffProfile {
  avgSkillScore: number;       // 0–100
  skillCount: number;
  systemCount: number;
  totalAllocated: number;      // sum of allocation percents
  workloadStatus: WorkloadStatus;
  certExpiringSoon: boolean;   // any cert expiring <= 60 days
}

function daysBetween(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / 86_400_000);
}

function workloadStatus(total: number): WorkloadStatus {
  if (total > 100) return 'overloaded';
  if (total > 85) return 'high';
  if (total > 50) return 'normal';
  return 'under_utilised';
}

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(StaffProfile)
    private readonly profileRepo: Repository<StaffProfile>,
    @InjectRepository(StaffSkill)
    private readonly skillRepo: Repository<StaffSkill>,
    @InjectRepository(StaffCertification)
    private readonly certRepo: Repository<StaffCertification>,
    @InjectRepository(SystemAssignment)
    private readonly assignRepo: Repository<SystemAssignment>,
  ) {}

  // ── Profiles ──────────────────────────────────────────────────────────

  private async enrich(profile: StaffProfile): Promise<EnrichedStaff> {
    const skills = await this.skillRepo.find({ where: { staffProfileId: profile.id, tenantId: profile.tenantId } });
    const assignments = await this.assignRepo.find({ where: { staffProfileId: profile.id, tenantId: profile.tenantId } });
    const certs = await this.certRepo.find({ where: { staffProfileId: profile.id, tenantId: profile.tenantId } });

    const avgSkillScore = skills.length > 0
      ? Math.round(skills.reduce((s, sk) => s + (sk.skillLevel ?? 2), 0) / skills.length * 20)
      : 0;

    const total = (profile.operationalPercent ?? 0) + (profile.projectsPercent ?? 0)
      + (profile.adminPercent ?? 0) + (profile.trainingPercent ?? 0);

    const now = new Date();
    const in60 = new Date(now.getTime() + 60 * 86_400_000);
    const certExpiringSoon = certs.some(
      (c) => c.expiryDate && new Date(c.expiryDate) >= now && new Date(c.expiryDate) <= in60,
    );

    return {
      ...profile,
      avgSkillScore,
      skillCount: skills.length,
      systemCount: assignments.length,
      totalAllocated: total,
      workloadStatus: workloadStatus(total),
      certExpiringSoon,
    };
  }

  async createProfile(tenantId: string, dto: CreateStaffProfileDto): Promise<EnrichedStaff> {
    const profile = this.profileRepo.create({ ...dto, tenantId } as Partial<StaffProfile>);
    const saved = await this.profileRepo.save(profile);
    return this.enrich(saved);
  }

  async findAllProfiles(
    tenantId: string,
    filters?: { roleType?: string; location?: string; onCall?: boolean; workloadStatus?: string; search?: string },
  ): Promise<EnrichedStaff[]> {
    const qb = this.profileRepo.createQueryBuilder('s').where('s.tenant_id = :tenantId', { tenantId });
    if (filters?.roleType) qb.andWhere('s.role_type = :roleType', { roleType: filters.roleType });
    if (filters?.location) qb.andWhere('s.location = :location', { location: filters.location });
    if (filters?.onCall === true) qb.andWhere('s.on_call_eligible = true');

    let list = await qb.orderBy('s.full_name', 'ASC').getMany();

    let enriched = await Promise.all(list.map((p) => this.enrich(p)));

    if (filters?.workloadStatus) {
      enriched = enriched.filter((e) => e.workloadStatus === filters!.workloadStatus);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      enriched = enriched.filter(
        (e) => e.fullName.toLowerCase().includes(q) ||
          (e.jobTitle ?? '').toLowerCase().includes(q) ||
          (e.department ?? '').toLowerCase().includes(q),
      );
    }
    return enriched;
  }

  async findOneProfile(tenantId: string, id: string): Promise<EnrichedStaff> {
    const profile = await this.profileRepo.findOne({ where: { id, tenantId } });
    if (!profile) throw new NotFoundException('Staff profile not found');
    return this.enrich(profile);
  }

  async updateProfile(tenantId: string, id: string, dto: UpdateStaffProfileDto): Promise<EnrichedStaff> {
    const existing = await this.profileRepo.findOne({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Staff profile not found');
    await this.profileRepo.update({ id, tenantId }, dto as Partial<StaffProfile>);
    return this.findOneProfile(tenantId, id);
  }

  async removeProfile(tenantId: string, id: string): Promise<void> {
    await this.findOneProfile(tenantId, id);
    await this.profileRepo.delete({ id, tenantId });
  }

  // ── Skills ────────────────────────────────────────────────────────────

  async addSkill(tenantId: string, staffProfileId: string, dto: AddSkillDto): Promise<StaffSkill> {
    await this.findOneProfile(tenantId, staffProfileId);
    const skill = this.skillRepo.create({ ...dto, tenantId, staffProfileId } as Partial<StaffSkill>);
    return this.skillRepo.save(skill);
  }

  async getSkillsForProfile(tenantId: string, staffProfileId: string): Promise<StaffSkill[]> {
    return this.skillRepo.find({
      where: { tenantId, staffProfileId },
      order: { skillCategory: 'ASC', skillName: 'ASC' },
    });
  }

  async removeSkill(tenantId: string, staffProfileId: string, skillId: string): Promise<void> {
    await this.skillRepo.delete({ id: skillId, tenantId, staffProfileId });
  }

  // ── Certifications ────────────────────────────────────────────────────

  async addCertification(tenantId: string, staffProfileId: string, dto: AddCertificationDto): Promise<StaffCertification> {
    await this.findOneProfile(tenantId, staffProfileId);
    const cert = this.certRepo.create({ ...dto, tenantId, staffProfileId } as Partial<StaffCertification>);
    return this.certRepo.save(cert);
  }

  async getCertificationsForProfile(tenantId: string, staffProfileId: string): Promise<StaffCertification[]> {
    return this.certRepo.find({
      where: { tenantId, staffProfileId },
      order: { expiryDate: 'ASC' },
    });
  }

  async removeCertification(tenantId: string, staffProfileId: string, certId: string): Promise<void> {
    await this.certRepo.delete({ id: certId, tenantId, staffProfileId });
  }

  // ── System Assignments ────────────────────────────────────────────────

  async addAssignment(tenantId: string, staffProfileId: string, dto: AddAssignmentDto): Promise<SystemAssignment> {
    await this.findOneProfile(tenantId, staffProfileId);
    const a = this.assignRepo.create({ ...dto, tenantId, staffProfileId } as Partial<SystemAssignment>);
    return this.assignRepo.save(a);
  }

  async getAssignmentsForProfile(tenantId: string, staffProfileId: string): Promise<SystemAssignment[]> {
    return this.assignRepo.find({
      where: { tenantId, staffProfileId },
      order: { role: 'ASC', systemName: 'ASC' },
    });
  }

  async removeAssignment(tenantId: string, staffProfileId: string, assignId: string): Promise<void> {
    await this.assignRepo.delete({ id: assignId, tenantId, staffProfileId });
  }

  // ── Stats ─────────────────────────────────────────────────────────────

  async getCapacityStats(tenantId: string): Promise<{
    total: number;
    onCallCount: number;
    avgCapacity: number;
    overloaded: number;
    highLoad: number;
    underUtilised: number;
    certsExpiring30: number;
    certsExpiring60: number;
    singlePointRisk: { systemName: string; primaryCount: number }[];
    topSkillGaps: { category: string; avgLevel: number }[];
    byRole: Record<string, number>;
    byEmployment: Record<string, number>;
  }> {
    const profiles = await this.profileRepo.find({ where: { tenantId } });
    const enriched = await Promise.all(profiles.map((p) => this.enrich(p)));

    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86_400_000);
    const in60 = new Date(now.getTime() + 60 * 86_400_000);

    const allCerts = await this.certRepo.find({ where: { tenantId } });
    const certsExpiring30 = allCerts.filter(
      (c) => c.expiryDate && new Date(c.expiryDate) >= now && new Date(c.expiryDate) <= in30,
    ).length;
    const certsExpiring60 = allCerts.filter(
      (c) => c.expiryDate && new Date(c.expiryDate) >= now && new Date(c.expiryDate) <= in60,
    ).length;

    const allAssignments = await this.assignRepo.find({ where: { tenantId } });
    const systemMap: Record<string, number> = {};
    allAssignments.filter((a) => a.role === 'primary').forEach((a) => {
      systemMap[a.systemName] = (systemMap[a.systemName] ?? 0) + 1;
    });
    const singlePointRisk = Object.entries(systemMap)
      .filter(([, cnt]) => cnt === 1)
      .map(([systemName, primaryCount]) => ({ systemName, primaryCount }))
      .slice(0, 10);

    const allSkills = await this.skillRepo.find({ where: { tenantId } });
    const catTotals: Record<string, number[]> = {};
    allSkills.forEach((s) => {
      const cat = s.skillCategory ?? 'unknown';
      if (!catTotals[cat]) catTotals[cat] = [];
      catTotals[cat].push(s.skillLevel ?? 2);
    });
    const topSkillGaps = Object.entries(catTotals)
      .map(([category, levels]) => ({ category, avgLevel: levels.reduce((a, b) => a + b, 0) / levels.length }))
      .sort((a, b) => a.avgLevel - b.avgLevel)
      .slice(0, 5);

    const byRole: Record<string, number> = {};
    const byEmployment: Record<string, number> = {};
    enriched.forEach((e) => {
      const r = e.roleType ?? 'other';
      byRole[r] = (byRole[r] ?? 0) + 1;
      const et = e.employmentType ?? 'unknown';
      byEmployment[et] = (byEmployment[et] ?? 0) + 1;
    });

    const allocations = enriched.map((e) => e.totalAllocated);
    const avgCapacity = allocations.length > 0
      ? Math.round(allocations.reduce((a, b) => a + b, 0) / allocations.length)
      : 0;

    return {
      total: enriched.length,
      onCallCount: enriched.filter((e) => e.onCallEligible).length,
      avgCapacity,
      overloaded: enriched.filter((e) => e.workloadStatus === 'overloaded').length,
      highLoad: enriched.filter((e) => e.workloadStatus === 'high').length,
      underUtilised: enriched.filter((e) => e.workloadStatus === 'under_utilised').length,
      certsExpiring30,
      certsExpiring60,
      singlePointRisk,
      topSkillGaps,
      byRole,
      byEmployment,
    };
  }

  /** Legacy stats method kept for backwards compat */
  async getSkillsGapStats(tenantId: string) {
    return this.getCapacityStats(tenantId);
  }
}
