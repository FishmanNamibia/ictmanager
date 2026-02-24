import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SoftwareLicense } from '../assets/software-license.entity';
import { CreateLicenseDto } from './dto/create-license.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';

export type LicenseStatus =
  | 'active'
  | 'expiring_critical'   // ≤ 30 days
  | 'expiring_soon'       // ≤ 90 days
  | 'expired'
  | 'over_allocated'
  | 'under_utilised'
  | 'perpetual';

export interface LicenseWithMeta extends SoftwareLicense {
  seatsAvailable: number;
  totalCost: number | null;
  daysRemaining: number | null;
  renewalQuarter: string | null;
  computedStatus: LicenseStatus;
}

export interface LicenseStats {
  total: number;
  active: number;
  expiringSoon: number;        // ≤ 90 days
  expiringCritical: number;    // ≤ 30 days
  expired: number;
  overAllocated: number;
  underUtilised: number;
  complianceScore: number;     // 0–100
  totalAnnualCost: number;
  totalSeats: number;
  totalUsedSeats: number;
  utilizationRate: number;     // %
  expiringIn30: LicenseWithMeta[];
  expiringIn60: LicenseWithMeta[];
  expiringIn90: LicenseWithMeta[];
  overAllocatedList: LicenseWithMeta[];
  renewalForecast: { quarter: string; count: number; totalCost: number }[];
  vendorSummary: { vendor: string; count: number; totalCost: number; expiringSoon: number }[];
  categoryBreakdown: { category: string; count: number; totalCost: number }[];
}

function addDays(d: Date, n: number) {
  return new Date(d.getTime() + n * 86_400_000);
}

function isoDate(d: Date | null): string | null {
  if (!d) return null;
  return new Date(d).toISOString().slice(0, 10);
}

function quarterLabel(d: Date): string {
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} FY${d.getFullYear()}`;
}

@Injectable()
export class LicensesService {
  constructor(
    @InjectRepository(SoftwareLicense)
    private readonly repo: Repository<SoftwareLicense>,
  ) {}

  // ── Helpers ─────────────────────────────────────────────────────────────

  private enrich(l: SoftwareLicense): LicenseWithMeta {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const expiry = l.expiryDate ? new Date(l.expiryDate) : null;
    if (expiry) expiry.setHours(0, 0, 0, 0);

    const daysRemaining = expiry
      ? Math.ceil((expiry.getTime() - now.getTime()) / 86_400_000)
      : null;

    const renewalQuarter = expiry ? quarterLabel(expiry) : null;

    const totalSeats = Number(l.totalSeats) || 0;
    const usedSeats = Number(l.usedSeats) || 0;
    const seatsAvailable = totalSeats - usedSeats;

    const costPerSeat = l.costPerSeat ? Number(l.costPerSeat) : (l.cost ? Number(l.cost) : null);
    const totalCost = costPerSeat != null ? costPerSeat * totalSeats : null;

    let computedStatus: LicenseStatus;
    if (usedSeats > totalSeats) {
      computedStatus = 'over_allocated';
    } else if (!expiry) {
      computedStatus = 'perpetual';
    } else if (daysRemaining! < 0) {
      computedStatus = 'expired';
    } else if (daysRemaining! <= 30) {
      computedStatus = 'expiring_critical';
    } else if (daysRemaining! <= 90) {
      computedStatus = 'expiring_soon';
    } else if (totalSeats > 0 && usedSeats < totalSeats * 0.25) {
      computedStatus = 'under_utilised';
    } else {
      computedStatus = 'active';
    }

    return { ...l, seatsAvailable, totalCost, daysRemaining, renewalQuarter, computedStatus };
  }

  // ── CRUD ────────────────────────────────────────────────────────────────

  async create(tenantId: string, dto: CreateLicenseDto): Promise<LicenseWithMeta> {
    // Sync vendor field for backwards compat
    const data = {
      ...dto,
      tenantId,
      vendor: dto.vendor ?? dto.vendorName,
      vendorName: dto.vendor ?? dto.vendorName,
    } as Partial<SoftwareLicense>;
    const saved = await this.repo.save(this.repo.create(data));
    return this.enrich(saved);
  }

  async findAll(tenantId: string, filters?: { status?: string; search?: string }): Promise<LicenseWithMeta[]> {
    const all = await this.repo.find({ where: { tenantId }, order: { softwareName: 'ASC' } });
    let enriched = all.map((l) => this.enrich(l));

    if (filters?.status && filters.status !== 'all') {
      enriched = enriched.filter((l) => l.computedStatus === filters!.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      enriched = enriched.filter((l) =>
        l.softwareName.toLowerCase().includes(q) ||
        (l.vendor ?? l.vendorName ?? '').toLowerCase().includes(q) ||
        (l.softwareCategory ?? '').toLowerCase().includes(q),
      );
    }
    return enriched;
  }

  async findOne(tenantId: string, id: string): Promise<LicenseWithMeta> {
    const l = await this.repo.findOne({ where: { id, tenantId } });
    if (!l) throw new NotFoundException('License not found');
    return this.enrich(l);
  }

  async update(tenantId: string, id: string, dto: UpdateLicenseDto): Promise<LicenseWithMeta> {
    const existing = await this.repo.findOne({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('License not found');
    const merged = {
      ...dto,
      vendor: dto.vendor ?? dto.vendorName ?? existing.vendor,
      vendorName: dto.vendor ?? dto.vendorName ?? existing.vendorName,
    } as Partial<SoftwareLicense>;
    await this.repo.update({ id, tenantId }, merged);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('License not found');
    await this.repo.delete({ id, tenantId });
  }

  // ── Stats / Compliance ──────────────────────────────────────────────────

  async getStats(tenantId: string): Promise<LicenseStats> {
    const all = await this.repo.find({ where: { tenantId } });
    const enriched = all.map((l) => this.enrich(l));

    const now = new Date();
    const in30 = addDays(now, 30);
    const in60 = addDays(now, 60);
    const in90 = addDays(now, 90);

    // Status-based groupings
    const overAllocatedList = enriched.filter((l) => l.computedStatus === 'over_allocated');
    const underUtilised = enriched.filter((l) => l.computedStatus === 'under_utilised');
    const active = enriched.filter((l) => l.computedStatus === 'active');

    // Date-based expiry counts — regardless of computedStatus so over-allocated licenses
    // expiring soon are still counted in the expiry cards.
    const isExpired = (l: LicenseWithMeta) => l.daysRemaining != null && l.daysRemaining < 0;
    const expired = enriched.filter(isExpired);
    const expiringIn30 = enriched.filter((l) => l.daysRemaining != null && l.daysRemaining >= 0 && l.daysRemaining <= 30);
    const expiringIn60 = enriched.filter((l) => l.daysRemaining != null && l.daysRemaining > 30 && l.daysRemaining <= 60);
    const expiringIn90 = enriched.filter((l) => l.daysRemaining != null && l.daysRemaining > 30 && l.daysRemaining <= 90);
    const expiringCritical = expiringIn30;                   // ≤ 30 days
    const expiringSoon = enriched.filter((l) => l.daysRemaining != null && l.daysRemaining >= 0 && l.daysRemaining <= 90);

    // Compliance score (100 = perfect)
    let score = 100;
    score -= Math.min(30, expired.length * 10);
    score -= Math.min(25, expiringIn30.length * 8);
    score -= Math.min(15, expiringIn60.length * 3);
    score -= Math.min(25, overAllocatedList.length * 12);
    score = Math.max(0, score);

    const totalAnnualCost = enriched.reduce((s, l) => s + (l.totalCost ?? 0), 0);
    const totalSeats = enriched.reduce((s, l) => s + Number(l.totalSeats), 0);
    const totalUsedSeats = enriched.reduce((s, l) => s + Number(l.usedSeats), 0);
    const utilizationRate = totalSeats > 0 ? Math.round((totalUsedSeats / totalSeats) * 100) : 0;

    // Renewal forecast by quarter
    const forecastMap: Record<string, { count: number; totalCost: number }> = {};
    enriched.forEach((l) => {
      if (l.expiryDate && l.renewalQuarter) {
        const expDate = new Date(l.expiryDate);
        if (expDate >= now) {
          const q = l.renewalQuarter;
          if (!forecastMap[q]) forecastMap[q] = { count: 0, totalCost: 0 };
          forecastMap[q].count++;
          forecastMap[q].totalCost += l.totalCost ?? 0;
        }
      }
    });
    const renewalForecast = Object.entries(forecastMap)
      .map(([quarter, v]) => ({ quarter, ...v }))
      .sort((a, b) => a.quarter.localeCompare(b.quarter))
      .slice(0, 6);

    // Vendor summary
    const vendorMap: Record<string, { count: number; totalCost: number; expiringSoon: number }> = {};
    enriched.forEach((l) => {
      const v = l.vendor ?? l.vendorName ?? 'Unknown';
      if (!vendorMap[v]) vendorMap[v] = { count: 0, totalCost: 0, expiringSoon: 0 };
      vendorMap[v].count++;
      vendorMap[v].totalCost += l.totalCost ?? 0;
      if (l.computedStatus === 'expiring_critical' || l.computedStatus === 'expiring_soon') vendorMap[v].expiringSoon++;
    });
    const vendorSummary = Object.entries(vendorMap)
      .map(([vendor, v]) => ({ vendor, ...v }))
      .sort((a, b) => b.totalCost - a.totalCost);

    // Category breakdown
    const catMap: Record<string, { count: number; totalCost: number }> = {};
    enriched.forEach((l) => {
      const c = l.softwareCategory ?? 'other';
      if (!catMap[c]) catMap[c] = { count: 0, totalCost: 0 };
      catMap[c].count++;
      catMap[c].totalCost += l.totalCost ?? 0;
    });
    const categoryBreakdown = Object.entries(catMap).map(([category, v]) => ({ category, ...v }));

    return {
      total: enriched.length,
      active: active.length,
      expiringSoon: expiringSoon.length,
      expiringCritical: expiringCritical.length,
      expired: expired.length,
      overAllocated: overAllocatedList.length,
      underUtilised: underUtilised.length,
      complianceScore: score,
      totalAnnualCost,
      totalSeats,
      totalUsedSeats,
      utilizationRate,
      expiringIn30,
      expiringIn60,
      expiringIn90,
      overAllocatedList,
      renewalForecast,
      vendorSummary,
      categoryBreakdown,
    };
  }
}
