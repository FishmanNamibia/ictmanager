import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset, AssetStatus, AssetType } from './asset.entity';
import { SoftwareLicense } from './software-license.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { CreateLicenseDto } from './dto/create-license.dto';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(SoftwareLicense)
    private readonly licenseRepo: Repository<SoftwareLicense>,
  ) {}

  // --- Assets ---
  async create(tenantId: string, dto: CreateAssetDto): Promise<Asset> {
    const asset = this.assetRepo.create({ ...dto, tenantId });
    return this.assetRepo.save(asset);
  }

  async findAll(tenantId: string, filters?: { status?: AssetStatus; type?: AssetType }): Promise<Asset[]> {
    const qb = this.assetRepo.createQueryBuilder('a').where('a.tenant_id = :tenantId', { tenantId });
    if (filters?.status) qb.andWhere('a.status = :status', { status: filters.status });
    if (filters?.type) qb.andWhere('a.type = :type', { type: filters.type });
    return qb.orderBy('a.assetTag', 'ASC').getMany();
  }

  async findOne(tenantId: string, id: string): Promise<Asset> {
    const asset = await this.assetRepo.findOne({ where: { id, tenantId } });
    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
  }

  async update(tenantId: string, id: string, dto: UpdateAssetDto): Promise<Asset> {
    await this.findOne(tenantId, id);
    await this.assetRepo.update({ id, tenantId }, dto as Partial<Asset>);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id);
    await this.assetRepo.delete({ id, tenantId });
  }

  // --- Licenses ---
  async createLicense(tenantId: string, dto: CreateLicenseDto): Promise<SoftwareLicense> {
    const license = this.licenseRepo.create({ ...dto, tenantId });
    return this.licenseRepo.save(license);
  }

  async findAllLicenses(tenantId: string): Promise<SoftwareLicense[]> {
    return this.licenseRepo.find({ where: { tenantId }, order: { softwareName: 'ASC' } });
  }

  async findOneLicense(tenantId: string, id: string): Promise<SoftwareLicense> {
    const license = await this.licenseRepo.findOne({ where: { id, tenantId } });
    if (!license) throw new NotFoundException('License not found');
    return license;
  }

  // --- Dashboard stats ---
  async getAssetStats(tenantId: string): Promise<{ total: number; byStatus: Record<string, number>; byType: Record<string, number> }> {
    const list = await this.assetRepo.find({ where: { tenantId } });
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    list.forEach((a) => {
      byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
      byType[a.type] = (byType[a.type] ?? 0) + 1;
    });
    return { total: list.length, byStatus, byType };
  }

  async getLicenseCompliance(tenantId: string): Promise<{ total: number; expiringSoon: number; overAllocated: number }> {
    const list = await this.licenseRepo.find({ where: { tenantId } });
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    let expiringSoon = 0;
    let overAllocated = 0;
    list.forEach((l) => {
      if (l.expiryDate && l.expiryDate <= in30Days && l.expiryDate >= now) expiringSoon++;
      if (l.usedSeats > l.totalSeats) overAllocated++;
    });
    return { total: list.length, expiringSoon, overAllocated };
  }
}
