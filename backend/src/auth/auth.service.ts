import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { TenantService } from '../tenant/tenant.service';
import { User } from '../users/user.entity';
import { Role } from '../common/roles';
import { serializeTenantSettings, TENANT_MODULE_IDS, OPTIONAL_TENANT_MODULE_IDS, TenantExperienceSettings } from '../tenant/tenant-settings';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
}

export interface AuthResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    tenantId: string;
    tenantSlug?: string;
  };
}

export interface AuthenticatedRequestUser {
  id: string;
  email: string;
  tenantId: string;
  role: string;
  fullName: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantService: TenantService,
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async resolveTenantForLogin(tenantSlug: string | undefined, email: string) {
    const normalizedSlug = tenantSlug?.trim();
    if (normalizedSlug) {
      return this.tenantService.findBySlug(normalizedSlug);
    }

    const singleTenant = await this.tenantService.findSingleActive();
    if (singleTenant) {
      return singleTenant;
    }

    const matchingUsers = (await this.usersService.findActiveByEmail(email))
      .filter((user) => user.tenant?.active);

    if (matchingUsers.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const uniqueTenantIds = Array.from(new Set(matchingUsers.map((user) => user.tenantId)));
    if (uniqueTenantIds.length === 1 && matchingUsers[0].tenant) {
      return matchingUsers[0].tenant;
    }

    throw new UnauthorizedException('Tenant selection is required for this account');
  }

  async login(tenantSlug: string | undefined, email: string, password: string): Promise<AuthResult> {
    const tenant = await this.resolveTenantForLogin(tenantSlug, email);
    const user = await this.usersService.findByEmail(tenant.id, email);
    if (!user || !user.active) throw new UnauthorizedException('Invalid credentials');
    const valid = await this.usersService.validatePassword(user, password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    await this.notificationsService.ensureWelcomeNotification(user);
    return this.issueToken(user);
  }

  async register(data: {
    organizationName: string;
    fullName: string;
    email: string;
    password: string;
  }): Promise<AuthResult> {
    const slug = data.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 40);

    const existingTenants = await this.tenantService.findAllActive();
    if (existingTenants.some((t) => t.slug === slug)) {
      throw new ConflictException('An organisation with a similar name already exists');
    }

    const tenant = await this.tenantService.create({
      slug,
      name: data.organizationName.trim(),
    });

    const allModules = [...TENANT_MODULE_IDS] as string[];
    const optionalModules = [...OPTIONAL_TENANT_MODULE_IDS] as string[];
    const defaultSettings: Partial<TenantExperienceSettings> = {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      branding: {
        organizationName: tenant.name,
        systemName: 'I-ICTMS',
        logoUrl: '',
        tagline: 'YOUR ICT COMMAND CENTRE',
        loginHeadline: 'Your digital workspace for everyday ICT management.',
        loginSubtext: 'Use I-ICTMS to manage assets and licenses, track applications, oversee ICT staff and skills, and report on risk and performance securely, in one place.',
        currency: 'NAD',
      },
      theme: {
        primaryColor: '#0d2137',
        secondaryColor: '#c9a227',
        backgroundColor: '#f0f2f5',
      },
      modules: { enabled: allModules as TenantExperienceSettings['modules']['enabled'] },
      access: {
        roleModules: {
          [Role.ICT_MANAGER]: optionalModules,
          [Role.ICT_STAFF]: optionalModules,
          [Role.BUSINESS_MANAGER]: optionalModules,
          [Role.EXECUTIVE]: optionalModules,
          [Role.AUDITOR]: optionalModules,
          [Role.VENDOR]: optionalModules,
        } as TenantExperienceSettings['access']['roleModules'],
      },
    };
    await this.tenantService.updateTenantSettings(tenant.id, defaultSettings);

    const user = await this.usersService.create({
      tenantId: tenant.id,
      email: data.email,
      password: data.password,
      fullName: data.fullName.trim(),
      role: Role.ICT_MANAGER,
    });

    await this.notificationsService.ensureWelcomeNotification(user);
    return this.issueToken(user);
  }

  async tenantsForEmail(email: string): Promise<{ slug: string; name: string }[]> {
    const users = (await this.usersService.findActiveByEmail(email))
      .filter((u) => u.tenant?.active);
    const seen = new Set<string>();
    const result: { slug: string; name: string }[] = [];
    for (const u of users) {
      if (!u.tenant || seen.has(u.tenantId)) continue;
      seen.add(u.tenantId);
      result.push({ slug: u.tenant.slug, name: u.tenant.name });
    }
    return result;
  }

  async validateSession(payload: JwtPayload): Promise<AuthenticatedRequestUser | null> {
    try {
      await this.tenantService.findActiveById(payload.tenantId);
      const user = await this.usersService.findById(payload.sub, payload.tenantId);
      if (!user.active) return null;
      return {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
        fullName: user.fullName,
      };
    } catch {
      return null;
    }
  }

  async issueToken(user: User): Promise<AuthResult> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload);
    const tenant = 'tenant' in user && user.tenant ? user.tenant : null;
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        tenantId: user.tenantId,
        tenantSlug: tenant?.slug,
      },
    };
  }
}
