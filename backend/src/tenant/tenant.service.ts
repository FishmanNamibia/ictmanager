import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';

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

  async create(data: { slug: string; name: string; logoUrl?: string }): Promise<Tenant> {
    const tenant = this.repo.create(data);
    return this.repo.save(tenant);
  }
}
