import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, Criticality, HostingType } from './application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly repo: Repository<Application>,
  ) {}

  async create(tenantId: string, dto: CreateApplicationDto): Promise<Application> {
    const app = this.repo.create({ ...dto, tenantId });
    return this.repo.save(app);
  }

  async findAll(tenantId: string, filters?: { criticality?: Criticality; healthStatus?: string }): Promise<Application[]> {
    const qb = this.repo.createQueryBuilder('a').where('a.tenant_id = :tenantId', { tenantId });
    if (filters?.criticality) qb.andWhere('a.criticality = :criticality', { criticality: filters.criticality });
    if (filters?.healthStatus) qb.andWhere('a.health_status = :healthStatus', { healthStatus: filters.healthStatus });
    return qb.orderBy('a.name', 'ASC').getMany();
  }

  async findOne(tenantId: string, id: string): Promise<Application> {
    const app = await this.repo.findOne({ where: { id, tenantId } });
    if (!app) throw new NotFoundException('Application not found');
    return app;
  }

  async update(tenantId: string, id: string, dto: UpdateApplicationDto): Promise<Application> {
    await this.findOne(tenantId, id);
    await this.repo.update({ id, tenantId }, dto as Partial<Application>);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id);
    await this.repo.delete({ id, tenantId });
  }

  async getPortfolioStats(tenantId: string): Promise<{ total: number; byCriticality: Record<string, number>; byHosting: Record<string, number> }> {
    const list = await this.repo.find({ where: { tenantId } });
    const byCriticality: Record<string, number> = {};
    const byHosting: Record<string, number> = {};
    list.forEach((a) => {
      byCriticality[a.criticality] = (byCriticality[a.criticality] ?? 0) + 1;
      byHosting[a.hostingType] = (byHosting[a.hostingType] ?? 0) + 1;
    });
    return { total: list.length, byCriticality, byHosting };
  }
}
