import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { Role } from '../common/roles';
import { normalizeTenantSettings, serializeTenantSettings, TENANT_MODULE_IDS, OPTIONAL_TENANT_MODULE_IDS, TenantExperienceSettings } from '../tenant/tenant-settings';

export type SubscriptionPlan = 'trial' | 'basic' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'trial' | 'active' | 'suspended' | 'cancelled';

export type TenantSummary = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  active: boolean;
  plan: string;
  subscriptionStatus: string;
  subscriptionExpiresAt: string | null;
  maxUsers: number | null;
  billingEmail: string | null;
  contactName: string | null;
  notes: string | null;
  userCount: number;
  createdAt: string;
  updatedAt: string;
};

export type OwnerStats = {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  byPlan: Record<string, number>;
};

@Injectable()
export class OwnerService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly usersService: UsersService,
  ) {}

  async listAllTenants(): Promise<TenantSummary[]> {
    const tenants = await this.tenantRepo.find({
      where: { isSystemTenant: false },
      order: { createdAt: 'DESC' },
    });
    const summaries = await Promise.all(tenants.map((t) => this.toSummary(t)));
    return summaries;
  }

  async getTenant(id: string): Promise<TenantSummary> {
    const tenant = await this.tenantRepo.findOne({ where: { id, isSystemTenant: false } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return this.toSummary(tenant);
  }

  async createTenant(data: {
    name: string;
    billingEmail: string;
    contactName?: string;
    plan: string;
    maxUsers?: number;
    notes?: string;
    adminEmail: string;
    adminPassword: string;
    adminFullName: string;
  }): Promise<TenantSummary> {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 40);

    const existing = await this.tenantRepo.findOne({ where: { slug } });
    if (existing) throw new ConflictException('An organisation with a similar name already exists');

    const allModules = [...TENANT_MODULE_IDS] as string[];
    const optionalModules = [...OPTIONAL_TENANT_MODULE_IDS] as string[];

    const tenant = this.tenantRepo.create({
      slug,
      name: data.name.trim(),
      plan: data.plan,
      subscriptionStatus: data.plan === 'trial' ? 'trial' : 'active',
      maxUsers: data.maxUsers ?? null,
      billingEmail: data.billingEmail.trim(),
      contactName: data.contactName?.trim() ?? null,
      notes: data.notes?.trim() ?? null,
      active: true,
      isSystemTenant: false,
    });

    const saved = await this.tenantRepo.save(tenant);

    const defaultSettings: Partial<TenantExperienceSettings> = {
      tenantId: saved.id,
      tenantSlug: saved.slug,
      branding: {
        organizationName: saved.name,
        systemName: 'I-ICTMS',
        logoUrl: '',
        tagline: 'YOUR ICT COMMAND CENTRE',
        loginHeadline: 'Your digital workspace for everyday ICT management.',
        loginSubtext: 'Use I-ICTMS to manage assets and licenses, track applications, oversee ICT staff and skills, and report on risk and performance securely, in one place.',
        currency: 'NAD',
      },
      theme: { primaryColor: '#0d2137', secondaryColor: '#c9a227', backgroundColor: '#f0f2f5' },
      modules: { enabled: allModules as TenantExperienceSettings['modules']['enabled'] },
      access: {
        roleModules: {
          [Role.OWNER]: optionalModules,
          [Role.ICT_MANAGER]: optionalModules,
          [Role.ICT_STAFF]: optionalModules,
          [Role.BUSINESS_MANAGER]: optionalModules,
          [Role.EXECUTIVE]: optionalModules,
          [Role.AUDITOR]: optionalModules,
          [Role.VENDOR]: optionalModules,
        } as TenantExperienceSettings['access']['roleModules'],
      },
    };

    saved.settings = serializeTenantSettings(defaultSettings as TenantExperienceSettings);
    await this.tenantRepo.save(saved);

    await this.usersService.create({
      tenantId: saved.id,
      email: data.adminEmail,
      password: data.adminPassword,
      fullName: data.adminFullName,
      role: Role.ICT_MANAGER,
    });

    return this.toSummary(saved);
  }

  async updateTenant(id: string, data: Partial<{
    name: string;
    plan: string;
    subscriptionStatus: string;
    subscriptionExpiresAt: string | null;
    maxUsers: number | null;
    billingEmail: string;
    contactName: string;
    notes: string;
    active: boolean;
  }>): Promise<TenantSummary> {
    const tenant = await this.tenantRepo.findOne({ where: { id, isSystemTenant: false } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (data.name !== undefined) tenant.name = data.name.trim();
    if (data.plan !== undefined) tenant.plan = data.plan;
    if (data.subscriptionStatus !== undefined) tenant.subscriptionStatus = data.subscriptionStatus;
    if (data.subscriptionExpiresAt !== undefined) {
      tenant.subscriptionExpiresAt = data.subscriptionExpiresAt ? new Date(data.subscriptionExpiresAt) : null;
    }
    if (data.maxUsers !== undefined) tenant.maxUsers = data.maxUsers;
    if (data.billingEmail !== undefined) tenant.billingEmail = data.billingEmail.trim();
    if (data.contactName !== undefined) tenant.contactName = data.contactName?.trim() ?? null;
    if (data.notes !== undefined) tenant.notes = data.notes?.trim() ?? null;
    if (data.active !== undefined) tenant.active = data.active;

    const saved = await this.tenantRepo.save(tenant);
    return this.toSummary(saved);
  }

  async getStats(): Promise<OwnerStats> {
    const tenants = await this.tenantRepo.find({ where: { isSystemTenant: false } });
    const byPlan: Record<string, number> = {};
    let activeTenants = 0;
    let trialTenants = 0;
    let suspendedTenants = 0;

    for (const t of tenants) {
      byPlan[t.plan] = (byPlan[t.plan] ?? 0) + 1;
      if (t.subscriptionStatus === 'active') activeTenants++;
      if (t.subscriptionStatus === 'trial') trialTenants++;
      if (t.subscriptionStatus === 'suspended') suspendedTenants++;
    }

    return {
      totalTenants: tenants.length,
      activeTenants,
      trialTenants,
      suspendedTenants,
      byPlan,
    };
  }

  private async toSummary(tenant: Tenant): Promise<TenantSummary> {
    const userCount = await this.userRepo.count({ where: { tenantId: tenant.id } });
    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      logoUrl: tenant.logoUrl,
      active: tenant.active,
      plan: tenant.plan ?? 'trial',
      subscriptionStatus: tenant.subscriptionStatus ?? 'trial',
      subscriptionExpiresAt: tenant.subscriptionExpiresAt?.toISOString() ?? null,
      maxUsers: tenant.maxUsers ?? null,
      billingEmail: tenant.billingEmail ?? null,
      contactName: tenant.contactName ?? null,
      notes: tenant.notes ?? null,
      userCount,
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
    };
  }
}
