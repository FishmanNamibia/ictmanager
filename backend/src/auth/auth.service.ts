import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantService: TenantService,
    private readonly jwtService: JwtService,
  ) {}

  async login(tenantSlug: string, email: string, password: string): Promise<AuthResult> {
    const tenant = await this.tenantService.findBySlug(tenantSlug);
    const user = await this.usersService.findByEmail(tenant.id, email);
    if (!user || !user.active) throw new UnauthorizedException('Invalid credentials');
    const valid = await this.usersService.validatePassword(user, password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return this.issueToken(user);
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    try {
      return await this.usersService.findById(payload.sub, payload.tenantId);
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
