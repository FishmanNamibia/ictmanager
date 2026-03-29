import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { TenantService } from '../tenant/tenant.service';
import { User } from '../users/user.entity';

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
