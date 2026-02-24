import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { Asset, AssetStatus, AssetType } from './asset.entity';
import { SoftwareLicense } from './software-license.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { CreateLicenseDto } from './dto/create-license.dto';

const ASSET_TYPES: AssetType[] = ['hardware', 'software', 'network', 'peripheral'];
const ASSET_STATUSES: AssetStatus[] = ['active', 'in_use', 'maintenance', 'retired', 'disposed'];

function excelDateToIso(value: string | number): string | undefined {
  if (value == null || value === '') return undefined;
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const n = typeof value === 'number' ? value : parseFloat(s);
  if (Number.isNaN(n)) return undefined;
  const excelEpoch = new Date(1899, 11, 30);
  const d = new Date(excelEpoch.getTime() + n * 86400000);
  return d.toISOString().slice(0, 10);
}

/** Map Excel/CSV header (any case) to our DTO field name. Snipe-IT, Lansweeper, and common inventory exports. */
const HEADER_MAP: Record<string, string> = {
  // Asset identification
  'asset tag': 'assetTag',
  'assettag': 'assetTag',
  'asset_tag': 'assetTag',
  'tag': 'assetTag',
  'asset id': 'assetTag',
  // Name
  'name': 'name',
  'asset name': 'name',
  'device name': 'name',
  'computer name': 'name',
  // Type & status
  'type': 'type',
  'status': 'status',
  'status label': 'statusLabel',
  'statuslabel': 'statusLabel',
  // Condition
  'condition': 'condition',
  'physical condition': 'condition',
  'asset condition': 'condition',
  // Hardware details
  'manufacturer': 'manufacturer',
  'make': 'manufacturer',
  'brand': 'manufacturer',
  'model': 'model',
  'model name': 'model',
  'model number': 'model',
  'serial': 'serialNumber',
  'serial number': 'serialNumber',
  'serialnumber': 'serialNumber',
  'serial no': 'serialNumber',
  'serial no.': 'serialNumber',
  // Network
  'ip address': 'ipAddress',
  'ip': 'ipAddress',
  'ipaddress': 'ipAddress',
  'ip addr': 'ipAddress',
  // Purchase info
  'purchase date': 'purchaseDate',
  'purchasedate': 'purchaseDate',
  'date of purchase': 'purchaseDate',
  'warranty': 'warrantyEnd',
  'warranty end': 'warrantyEnd',
  'warrantyend': 'warrantyEnd',
  'warranty expiry': 'warrantyEnd',
  'warranty expiry date': 'warrantyEnd',
  'eol date': 'warrantyEnd',
  'end of life': 'warrantyEnd',
  'cost': 'cost',
  'purchase cost': 'cost',
  'purchasecost': 'cost',
  'price': 'cost',
  'unit price': 'cost',
  'amount': 'cost',
  // Supplier / PO
  'supplier': 'supplier',
  'vendor': 'supplier',
  'supplier name': 'supplier',
  'vendor name': 'supplier',
  'po number': 'poNumber',
  'po no': 'poNumber',
  'po no.': 'poNumber',
  'purchase order': 'poNumber',
  'invoice number': 'poNumber',
  'invoice no': 'poNumber',
  'order number': 'poNumber',
  // Assignment
  'assigned to': 'assignedToName',
  'assignedto': 'assignedToName',
  'assigned user': 'assignedToName',
  'assignee': 'assignedToName',
  'checked out to': 'assignedToName',
  'department': 'assignedToDepartment',
  'assigned to department': 'assignedToDepartment',
  'dept': 'assignedToDepartment',
  // Location
  'location': 'location',
  'default location': 'location',
  'site': 'location',
  'office': 'location',
  // Notes & category
  'notes': 'notes',
  'comments': 'notes',
  'remarks': 'notes',
  'category': 'category',
};
/** Snipe-IT / inventory status label -> our status enum */
const STATUS_LABEL_MAP: Record<string, AssetStatus> = {
  'deployed': 'in_use',
  'ready to deploy': 'active',
  'active': 'active',
  'in use': 'in_use',
  'in_use': 'in_use',
  'maintenance': 'maintenance',
  'retired': 'retired',
  'disposed': 'disposed',
  'broken': 'maintenance',
  'out for repair': 'maintenance',
  'pending': 'active',
  'archived': 'retired',
};
/** Category (e.g. Snipe-IT) -> our type */
const CATEGORY_TO_TYPE: Record<string, AssetType> = {
  'laptop': 'hardware',
  'desktop': 'hardware',
  'mobile phone': 'hardware',
  'tablet': 'hardware',
  'monitor': 'hardware',
  'server': 'hardware',
  'network': 'network',
  'peripheral': 'peripheral',
  'software': 'software',
  'hardware': 'hardware',
};

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

  async importFromExcel(
    tenantId: string,
    buffer: Buffer,
    filename?: string,
  ): Promise<{ created: number; errors: { row: number; message: string }[] }> {
    const errors: { row: number; message: string }[] = [];
    let created = 0;
    const isCsv = /\.csv$/i.test(filename || '');
    const workbook = isCsv
      ? XLSX.read(buffer.toString('utf-8'), { type: 'string', raw: false })
      : XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return { created: 0, errors: [{ row: 0, message: 'Workbook has no sheets' }] };
    const sheet = workbook.Sheets[sheetName];
    const allRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as (string | number)[][];
    // Drop fully empty rows (handles leading/trailing blank rows in some exports)
    const nonEmptyRows = allRows.filter((r) => r.some((c) => String(c).trim() !== ''));
    if (nonEmptyRows.length < 2) {
      return { created: 0, errors: [{ row: 1, message: `File appears empty or has only a header row (${nonEmptyRows.length} non-empty row(s) found). Please add data rows below the header and try again.` }] };
    }
    const rows = nonEmptyRows;
    // Find first row that looks like a header (contains known column names) in case there are preamble rows
    let headerIdx = 0;
    const knownHeaders = new Set(Object.keys(HEADER_MAP));
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
      const candidate = rows[i].map((c) => String(c).trim().toLowerCase().replace(/\s+/g, ' '));
      if (candidate.some((h) => knownHeaders.has(h))) { headerIdx = i; break; }
    }
    const finalHeaderRow = rows[headerIdx].map((c) => String(c).trim().toLowerCase().replace(/\s+/g, ' '));
    const colIndex: Record<string, number> = {};
    finalHeaderRow.forEach((h, i) => {
      const key = HEADER_MAP[h] ?? h.replace(/\s+/g, '');
      if (key) colIndex[key] = i;
    });
    const get = (row: (string | number)[], field: string): string => {
      const i = colIndex[field];
      if (i == null) return '';
      const v = row[i];
      if (v == null) return '';
      return String(v).trim();
    };
    for (let r = headerIdx + 1; r < rows.length; r++) {
      const row = rows[r] as (string | number)[];
      const assetTag = get(row, 'assetTag');
      const name = get(row, 'name');
      if (!assetTag && !name) continue;
      if (!assetTag) {
        errors.push({ row: r + 1, message: 'Asset tag is required' });
        continue;
      }
      if (!name) {
        errors.push({ row: r + 1, message: 'Name is required' });
        continue;
      }
      const categoryRaw = get(row, 'category').toLowerCase().trim();
      const typeRaw = get(row, 'type').toLowerCase().trim().replace(/\s+/g, '_');
      let type: AssetType = CATEGORY_TO_TYPE[categoryRaw] ?? (ASSET_TYPES.includes(typeRaw as AssetType) ? (typeRaw as AssetType) : 'hardware');
      const statusLabelRaw = get(row, 'statusLabel').toLowerCase().trim();
      const statusRaw = get(row, 'status').toLowerCase().trim().replace(/\s+/g, '_');
      let status: AssetStatus = statusLabelRaw
        ? (STATUS_LABEL_MAP[statusLabelRaw] ?? STATUS_LABEL_MAP[statusRaw] ?? 'active')
        : (STATUS_LABEL_MAP[statusRaw] ?? statusRaw as AssetStatus);
      if (!ASSET_STATUSES.includes(status)) status = 'active';
      const purchaseDateRaw = colIndex['purchaseDate'] != null ? row[colIndex['purchaseDate']] : get(row, 'purchaseDate');
      const warrantyEndRaw = colIndex['warrantyEnd'] != null ? row[colIndex['warrantyEnd']] : get(row, 'warrantyEnd');
      const costStr = get(row, 'cost');
      const purchaseDate = excelDateToIso(purchaseDateRaw as string | number);
      const warrantyEnd = excelDateToIso(warrantyEndRaw as string | number);
      const conditionRaw = get(row, 'condition').toLowerCase().trim();
      const ASSET_CONDITION_VALUES = ['new', 'good', 'fair', 'poor', 'damaged'];
      const condition = ASSET_CONDITION_VALUES.includes(conditionRaw) ? conditionRaw as import('./asset.entity').AssetCondition : undefined;
      const dto: CreateAssetDto = {
        assetTag,
        name,
        type: type as AssetType,
        status: status as AssetStatus,
        condition,
        manufacturer: get(row, 'manufacturer') || undefined,
        model: get(row, 'model') || undefined,
        serialNumber: get(row, 'serialNumber') || undefined,
        ipAddress: get(row, 'ipAddress') || undefined,
        purchaseDate,
        warrantyEnd,
        cost: costStr && !Number.isNaN(parseFloat(costStr)) ? parseFloat(costStr) : undefined,
        supplier: get(row, 'supplier') || undefined,
        poNumber: get(row, 'poNumber') || undefined,
        assignedToName: get(row, 'assignedToName') || undefined,
        assignedToDepartment: get(row, 'assignedToDepartment') || undefined,
        location: get(row, 'location') || undefined,
        notes: get(row, 'notes') || undefined,
      };
      try {
        await this.create(tenantId, dto);
        created++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to create asset';
        errors.push({ row: r + 1, message: msg });
      }
    }
    return { created, errors };
  }

  getImportTemplateBuffer(): Buffer {
    const headers = [
      'Asset Tag',
      'Name',
      'Type',
      'Status',
      'Condition',
      'Manufacturer',
      'Model',
      'Serial Number',
      'IP Address',
      'Purchase Date',
      'Warranty Expiry Date',
      'Purchase Cost',
      'Supplier',
      'PO Number',
      'Assigned To',
      'Department',
      'Location',
      'Notes',
    ];
    const example = [
      'NSA/LAP/001', 'Dell Latitude 5520', 'hardware', 'in_use', 'good',
      'Dell', 'Latitude 5520', 'SN-ABC123456', '192.168.1.50',
      '2024-01-15', '2027-01-15', '18500',
      'Namibia Computer Warehouse', 'PO-2024-001',
      'John Ndapewa', 'ICT', 'Head Office – Room 3B',
      'Snipe-IT / inventory import compatible',
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Assets');
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
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

  async getLicenseCompliance(tenantId: string): Promise<{
    total: number;
    expiringSoon: number;
    overAllocated: number;
    expiringIn30: number;
    expiringIn60: number;
    expiringIn90: number;
    renewalsThisQuarter: number;
    complianceRiskScore: number;
    expiringIn30Days: Array<{ id: string; softwareName: string; expiryDate: string }>;
    overAllocatedList: Array<{ id: string; softwareName: string; usedSeats: number; totalSeats: number }>;
    renewalsDueThisQuarter: Array<{ id: string; softwareName: string; expiryDate: string }>;
  }> {
    const list = await this.licenseRepo.find({ where: { tenantId } });
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
    const in30 = addDays(now, 30);
    const in60 = addDays(now, 60);
    const in90 = addDays(now, 90);
    const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0); // last day of current quarter

    let expiringSoon = 0;
    let expiringIn30 = 0;
    let expiringIn60 = 0;
    let expiringIn90 = 0;
    let renewalsThisQuarter = 0;
    let overAllocated = 0;
    const expiringIn30Days: Array<{ id: string; softwareName: string; expiryDate: string }> = [];
    const overAllocatedList: Array<{ id: string; softwareName: string; usedSeats: number; totalSeats: number }> = [];
    const renewalsDueThisQuarter: Array<{ id: string; softwareName: string; expiryDate: string }> = [];

    list.forEach((l) => {
      const exp = l.expiryDate ? new Date(l.expiryDate) : null;
      if (exp) {
        exp.setHours(0, 0, 0, 0);
        if (exp >= now && exp <= in30) {
          expiringSoon++;
          expiringIn30++;
          expiringIn30Days.push({
            id: l.id,
            softwareName: l.softwareName,
            expiryDate: l.expiryDate!.toISOString().slice(0, 10),
          });
        } else if (exp > in30 && exp <= in60) expiringIn60++;
        else if (exp > in60 && exp <= in90) expiringIn90++;
        if (exp >= now && exp <= quarterEnd) {
          renewalsThisQuarter++;
          renewalsDueThisQuarter.push({
            id: l.id,
            softwareName: l.softwareName,
            expiryDate: l.expiryDate!.toISOString().slice(0, 10),
          });
        }
      }
      if (l.usedSeats > l.totalSeats) {
        overAllocated++;
        overAllocatedList.push({
          id: l.id,
          softwareName: l.softwareName,
          usedSeats: Number(l.usedSeats),
          totalSeats: Number(l.totalSeats),
        });
      }
    });

    // Compliance risk score 0–100 (100 = best). Deduct for expiring soon, over-allocated, renewals due.
    let complianceRiskScore = 100;
    complianceRiskScore -= Math.min(25, expiringIn30 * 8);
    complianceRiskScore -= Math.min(15, expiringIn60 * 3);
    complianceRiskScore -= Math.min(10, expiringIn90 * 2);
    complianceRiskScore -= Math.min(30, overAllocated * 15);
    complianceRiskScore = Math.max(0, complianceRiskScore);

    return {
      total: list.length,
      expiringSoon,
      overAllocated,
      expiringIn30,
      expiringIn60,
      expiringIn90,
      renewalsThisQuarter,
      complianceRiskScore,
      expiringIn30Days,
      overAllocatedList,
      renewalsDueThisQuarter,
    };
  }
}
