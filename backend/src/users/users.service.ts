import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { Role } from '../common/roles';

export type PublicUser = {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: Role;
  active: boolean;
  department: string | null;
  jobTitle: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  toPublic(user: User): PublicUser {
    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      fullName: user.fullName,
      role: user.role as Role,
      active: user.active,
      department: user.department,
      jobTitle: user.jobTitle,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async create(data: {
    tenantId: string;
    email: string;
    password: string;
    fullName: string;
    role: Role;
    department?: string;
    jobTitle?: string;
  }): Promise<User> {
    const existing = await this.repo.findOne({
      where: { tenantId: data.tenantId, email: data.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('User with this email already exists in tenant');
    const hash = await bcrypt.hash(data.password, 12);
    const user = this.repo.create({
      ...data,
      email: data.email.toLowerCase(),
      passwordHash: hash,
    });
    return this.repo.save(user);
  }

  async findByEmail(tenantId: string, email: string): Promise<User | null> {
    return this.repo.findOne({
      where: { tenantId, email: email.toLowerCase() },
      relations: ['tenant'],
    });
  }

  async findActiveByEmail(email: string): Promise<User[]> {
    return this.repo.find({
      where: {
        email: email.toLowerCase(),
        active: true,
      },
      relations: ['tenant'],
      order: { fullName: 'ASC' },
    });
  }

  async findById(id: string, tenantId?: string): Promise<User> {
    const where: { id: string; tenantId?: string } = { id };
    if (tenantId) where.tenantId = tenantId;
    const user = await this.repo.findOne({ where, relations: ['tenant'] });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Tenant users for internal use (includes password hash — do not return raw from controllers). */
  async findAllByTenant(tenantId: string): Promise<User[]> {
    return this.repo.find({
      where: { tenantId },
      order: { fullName: 'ASC' },
    });
  }

  async update(
    tenantId: string,
    id: string,
    dto: {
      fullName?: string;
      email?: string;
      role?: Role;
      active?: boolean;
      department?: string;
      jobTitle?: string;
      password?: string;
    },
  ): Promise<PublicUser> {
    const user = await this.findById(id, tenantId);
    const nextRole = dto.role ?? (user.role as Role);
    const nextActive = dto.active !== undefined ? dto.active : user.active;
    const willBeActiveManager = nextRole === Role.ICT_MANAGER && nextActive;

    if (!willBeActiveManager) {
      const otherActiveManagers = await this.repo.count({
        where: {
          tenantId,
          role: Role.ICT_MANAGER,
          active: true,
          id: Not(user.id),
        },
      });
      if (otherActiveManagers < 1) {
        throw new BadRequestException(
          'Organisation must keep at least one active ICT Manager account.',
        );
      }
    }

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const existing = await this.repo.findOne({
        where: { tenantId, email: dto.email.toLowerCase() },
      });
      if (existing && existing.id !== user.id) {
        throw new ConflictException('Another user already uses this email');
      }
      user.email = dto.email.toLowerCase();
    }
    if (dto.fullName !== undefined) user.fullName = dto.fullName.trim();
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.active !== undefined) user.active = dto.active;
    if (dto.department !== undefined) user.department = dto.department || null;
    if (dto.jobTitle !== undefined) user.jobTitle = dto.jobTitle || null;
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    const saved = await this.repo.save(user);
    return this.toPublic(saved);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }
}
