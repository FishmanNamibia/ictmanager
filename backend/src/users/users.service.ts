import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { Role } from '../common/roles';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

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

  async findById(id: string, tenantId?: string): Promise<User> {
    const where: { id: string; tenantId?: string } = { id };
    if (tenantId) where.tenantId = tenantId;
    const user = await this.repo.findOne({ where, relations: ['tenant'] });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findAllByTenant(tenantId: string): Promise<User[]> {
    return this.repo.find({
      where: { tenantId },
      order: { fullName: 'ASC' },
      relations: ['tenant'],
    });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }
}
