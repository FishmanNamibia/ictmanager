import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { UpdateTenantSettingsDto } from './dto/update-tenant-settings.dto';
import {
  normalizeTenantSettings,
  serializeTenantSettings,
  TenantExperienceSettings,
} from './tenant-settings';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly repo: Repository<Tenant>,
  ) {}

  async findBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.repo.findOne({ where: { slug, active: true } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.repo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findActiveById(id: string): Promise<Tenant> {
    const tenant = await this.repo.findOne({ where: { id, active: true } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findAllActive(): Promise<Tenant[]> {
    return this.repo.find({
      where: { active: true },
      order: { name: 'ASC' },
    });
  }

  async findSingleActive(): Promise<Tenant | null> {
    const tenants = await this.findAllActive();
    return tenants.length === 1 ? tenants[0] : null;
  }

  async create(data: { slug: string; name: string; logoUrl?: string }): Promise<Tenant> {
    const tenant = this.repo.create(data);
    return this.repo.save(tenant);
  }

  async getExperienceSettings(tenantId: string): Promise<TenantExperienceSettings> {
    const tenant = await this.findById(tenantId);
    return normalizeTenantSettings(tenant);
  }

  async getPublicBrandingBySlug(slug: string) {
    const tenant = await this.findBySlug(slug);
    const settings = normalizeTenantSettings(tenant);
    return {
      tenantId: settings.tenantId,
      tenantSlug: settings.tenantSlug,
      branding: settings.branding,
      theme: settings.theme,
    };
  }

  async getDefaultPublicBranding() {
    const singleTenant = await this.findSingleActive();
    const tenant = singleTenant ?? (await this.findAllActive())[0];
    if (!tenant) throw new NotFoundException('Tenant not found');
    const settings = normalizeTenantSettings(tenant);
    return {
      tenantId: settings.tenantId,
      tenantSlug: settings.tenantSlug,
      branding: settings.branding,
      theme: settings.theme,
    };
  }

  async updateTenantSettings(tenantId: string, settings: Partial<TenantExperienceSettings>): Promise<void> {
    const tenant = await this.findById(tenantId);
    tenant.settings = {
      ...(tenant.settings && typeof tenant.settings === 'object' ? tenant.settings : {}),
      ...serializeTenantSettings(settings as TenantExperienceSettings),
    };
    await this.repo.save(tenant);
  }

  async updateLogoUrl(tenantId: string, logoUrl: string): Promise<void> {
    const tenant = await this.findById(tenantId);
    tenant.logoUrl = logoUrl;
    const existingSettings =
      tenant.settings && typeof tenant.settings === 'object' ? tenant.settings : {};
    tenant.settings = {
      ...existingSettings,
      branding: {
        ...(existingSettings as Record<string, unknown>).branding as Record<string, unknown> ?? {},
        logoUrl,
      },
    };
    await this.repo.save(tenant);
  }

  async updateExperienceSettings(
    tenantId: string,
    dto: UpdateTenantSettingsDto,
  ): Promise<TenantExperienceSettings> {
    const tenant = await this.findById(tenantId);
    const current = normalizeTenantSettings(tenant);

    const next: TenantExperienceSettings = {
      ...current,
      branding: {
        ...current.branding,
        ...dto.branding,
      },
      theme: {
        ...current.theme,
        ...dto.theme,
      },
      modules: {
        enabled: dto.modules?.enabled ?? current.modules.enabled,
      },
      access: {
        roleModules: {
          ...current.access.roleModules,
          ...(dto.access?.roleModules ?? {}),
        } as TenantExperienceSettings['access']['roleModules'],
      },
    };

    tenant.name = next.branding.organizationName;
    tenant.logoUrl = next.branding.logoUrl || null;
    const existingSettings =
      tenant.settings && typeof tenant.settings === 'object' ? tenant.settings : {};
    tenant.settings = {
      ...existingSettings,
      ...serializeTenantSettings(next),
    };

    const saved = await this.repo.save(tenant);
    return normalizeTenantSettings(saved);
  }
}
