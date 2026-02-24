import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor, VendorContract } from './entities';

type DashboardStats = {
  totalVendors: number;
  activeVendors: number;
  activeContracts: number;
  expiringIn90Days: number;
  expiredContracts: number;
  averageSlaMetPercent: number;
  annualContractValue: number;
  lowPerformanceVendors: number;
};

@Injectable()
export class VendorsContractsService {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,
    @InjectRepository(VendorContract)
    private readonly contractRepo: Repository<VendorContract>,
  ) {}

  async listVendors(tenantId: string, status?: string): Promise<Vendor[]> {
    const where: { tenantId: string; status?: string } = { tenantId };
    if (status) where.status = status;
    return this.vendorRepo.find({ where, order: { name: 'ASC' } });
  }

  async getVendor(tenantId: string, id: string): Promise<Vendor> {
    const vendor = await this.vendorRepo.findOne({ where: { id, tenantId } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async createVendor(tenantId: string, data: Partial<Vendor>): Promise<Vendor> {
    const vendor = this.vendorRepo.create({
      ...data,
      tenantId,
      status: data.status || 'active',
      performanceScore: Number(data.performanceScore ?? 100),
    });
    return this.vendorRepo.save(vendor);
  }

  async updateVendor(tenantId: string, id: string, data: Partial<Vendor>): Promise<Vendor> {
    await this.getVendor(tenantId, id);
    await this.vendorRepo.update({ id, tenantId }, data as any);
    return this.getVendor(tenantId, id);
  }

  async deleteVendor(tenantId: string, id: string): Promise<void> {
    await this.getVendor(tenantId, id);
    await this.vendorRepo.delete({ id, tenantId });
  }

  async listContracts(tenantId: string, status?: string, vendorId?: string): Promise<VendorContract[]> {
    const where: { tenantId: string; status?: string; vendorId?: string } = { tenantId };
    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;
    return this.contractRepo.find({
      where,
      relations: ['vendor'],
      order: { endDate: 'ASC', createdAt: 'DESC' },
    });
  }

  async getContract(tenantId: string, id: string): Promise<VendorContract> {
    const contract = await this.contractRepo.findOne({ where: { id, tenantId }, relations: ['vendor'] });
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async createContract(tenantId: string, data: Partial<VendorContract>): Promise<VendorContract> {
    if (!data.vendorId) throw new NotFoundException('Vendor is required');
    await this.getVendor(tenantId, data.vendorId);
    const contract = this.contractRepo.create({
      ...data,
      tenantId,
      status: data.status || 'active',
      renewalNoticeDays: Number(data.renewalNoticeDays ?? 90),
      autoRenew: Boolean(data.autoRenew ?? false),
      currency: data.currency || 'NAD',
    });
    return this.contractRepo.save(contract);
  }

  async updateContract(tenantId: string, id: string, data: Partial<VendorContract>): Promise<VendorContract> {
    const current = await this.getContract(tenantId, id);
    if (data.vendorId && data.vendorId !== current.vendorId) {
      await this.getVendor(tenantId, data.vendorId);
    }
    await this.contractRepo.update({ id, tenantId }, data as any);
    return this.getContract(tenantId, id);
  }

  async deleteContract(tenantId: string, id: string): Promise<void> {
    await this.getContract(tenantId, id);
    await this.contractRepo.delete({ id, tenantId });
  }

  async getDashboardStats(tenantId: string): Promise<DashboardStats> {
    const [vendors, contracts] = await Promise.all([
      this.listVendors(tenantId),
      this.listContracts(tenantId),
    ]);

    const now = new Date();
    const ninetyDays = new Date();
    ninetyDays.setDate(ninetyDays.getDate() + 90);

    const activeContracts = contracts.filter((contract) => contract.status === 'active');
    const expiringIn90Days = activeContracts.filter((contract) => contract.endDate && new Date(contract.endDate) >= now && new Date(contract.endDate) <= ninetyDays).length;
    const expiredContracts = contracts.filter((contract) => contract.endDate && new Date(contract.endDate) < now && contract.status !== 'terminated').length;
    const slaSamples = contracts
      .map((contract) => (contract.slaMetPercent == null ? null : Number(contract.slaMetPercent)))
      .filter((value): value is number => Number.isFinite(value));
    const averageSlaMetPercent = slaSamples.length ? Math.round((slaSamples.reduce((acc, value) => acc + value, 0) / slaSamples.length) * 100) / 100 : 0;
    const annualContractValue = Math.round(contracts.reduce((acc, contract) => acc + Number(contract.annualValue || 0), 0) * 100) / 100;
    const lowPerformanceVendors = vendors.filter((vendor) => Number(vendor.performanceScore || 0) < 60).length;

    return {
      totalVendors: vendors.length,
      activeVendors: vendors.filter((vendor) => vendor.status === 'active').length,
      activeContracts: activeContracts.length,
      expiringIn90Days,
      expiredContracts,
      averageSlaMetPercent,
      annualContractValue,
      lowPerformanceVendors,
    };
  }
}
