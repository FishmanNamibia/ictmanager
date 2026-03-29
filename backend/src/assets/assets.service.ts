import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { AuditLog } from '../audit/audit-log.entity';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/user.entity';
import { Asset, AssetCondition, AssetStatus, AssetType } from './asset.entity';
import { AssetDocument } from './asset-document.entity';
import {
  AssetMovement,
  AssetMovementType,
} from './asset-movement.entity';
import { AssetVerification } from './asset-verification.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { CreateLicenseDto } from './dto/create-license.dto';
import { CreateAssetMovementDto } from './dto/create-asset-movement.dto';
import { ApproveAssetMovementDto } from './dto/approve-asset-movement.dto';
import { CreateAssetVerificationDto } from './dto/create-asset-verification.dto';
import { ResolveAssetVerificationDto } from './dto/resolve-asset-verification.dto';
import { CreateAssetDocumentDto } from './dto/create-asset-document.dto';
import { SoftwareLicense } from './software-license.entity';

const ASSET_TYPES: AssetType[] = ['hardware', 'software', 'network', 'peripheral'];
const ASSET_STATUSES: AssetStatus[] = ['active', 'in_use', 'maintenance', 'retired', 'disposed'];
const ASSET_CONDITIONS: AssetCondition[] = ['new', 'good', 'fair', 'poor', 'damaged'];
const ASSET_MOVEMENT_TYPES: AssetMovementType[] = ['stock_in', 'stock_out', 'transfer', 'return', 'adjustment', 'damaged', 'lost', 'disposal', 'maintenance'];
const VERIFICATION_TYPES = ['spot_check', 'stock_take', 'handover'] as const;

type AssetActor = {
  userId?: string | null;
  actorName?: string | null;
  role?: string | null;
  ip?: string | null;
};

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

const HEADER_MAP: Record<string, string> = {
  'asset tag': 'assetTag',
  'assettag': 'assetTag',
  'asset_tag': 'assetTag',
  'tag': 'assetTag',
  'asset id': 'assetTag',
  'barcode': 'barcode',
  'bar code': 'barcode',
  'barcode number': 'barcode',
  'barcode value': 'barcode',
  'scan code': 'barcode',
  'name': 'name',
  'asset name': 'name',
  'device name': 'name',
  'computer name': 'name',
  'description': 'description',
  'type': 'type',
  'subtype': 'assetSubtype',
  'asset subtype': 'assetSubtype',
  'asset_subtype': 'assetSubtype',
  'equipment subtype': 'assetSubtype',
  'status': 'status',
  'status label': 'statusLabel',
  'statuslabel': 'statusLabel',
  'condition': 'condition',
  'physical condition': 'condition',
  'asset condition': 'condition',
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
  'ip address': 'ipAddress',
  'ip': 'ipAddress',
  'ipaddress': 'ipAddress',
  'ip addr': 'ipAddress',
  'battery install date': 'batteryInstallDate',
  'battery replacement due': 'batteryReplacementDue',
  'battery expiry': 'batteryReplacementDue',
  'load capacity kva': 'loadCapacityKva',
  'capacity kva': 'loadCapacityKva',
  'runtime minutes': 'runtimeMinutes',
  'runtime': 'runtimeMinutes',
  'protected systems': 'protectedSystems',
  'covered systems': 'protectedSystems',
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
  'expected end of life': 'expectedEndOfLife',
  'replacement due': 'expectedEndOfLife',
  'cost': 'cost',
  'purchase cost': 'cost',
  'purchasecost': 'cost',
  'price': 'cost',
  'unit price': 'cost',
  'amount': 'cost',
  'useful life months': 'usefulLifeMonths',
  'useful life': 'usefulLifeMonths',
  'supplier': 'supplier',
  'vendor': 'supplier',
  'supplier name': 'supplier',
  'vendor name': 'supplier',
  'maintenance provider': 'maintenanceProvider',
  'service provider': 'maintenanceProvider',
  'maintenance vendor': 'maintenanceProvider',
  'maintenance frequency months': 'maintenanceFrequencyMonths',
  'maintenance frequency': 'maintenanceFrequencyMonths',
  'last maintenance date': 'lastMaintenanceDate',
  'next maintenance date': 'nextMaintenanceDate',
  'maintenance contract end': 'maintenanceContractEnd',
  'service contract end': 'maintenanceContractEnd',
  'po number': 'poNumber',
  'po no': 'poNumber',
  'po no.': 'poNumber',
  'purchase order': 'poNumber',
  'invoice number': 'poNumber',
  'invoice no': 'poNumber',
  'order number': 'poNumber',
  'assigned to': 'assignedToName',
  'assignedto': 'assignedToName',
  'assigned user': 'assignedToName',
  'assignee': 'assignedToName',
  'checked out to': 'assignedToName',
  'department': 'assignedToDepartment',
  'assigned to department': 'assignedToDepartment',
  'dept': 'assignedToDepartment',
  'location': 'location',
  'default location': 'location',
  'site': 'location',
  'office': 'location',
  'notes': 'notes',
  'comments': 'notes',
  'remarks': 'notes',
  'category': 'category',
};

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

const ASSET_SUBTYPES = ['ups', 'server', 'laptop', 'desktop', 'printer', 'switch', 'router', 'other'] as const;
const AUDIT_FIELDS: Array<keyof Asset> = [
  'assetTag', 'barcode', 'name', 'description', 'type', 'assetSubtype', 'status', 'condition',
  'manufacturer', 'model', 'serialNumber', 'purchaseDate', 'warrantyEnd', 'expectedEndOfLife',
  'cost', 'usefulLifeMonths', 'assignedToUserId', 'assignedToName', 'assignedToDepartment',
  'location', 'supplier', 'maintenanceProvider', 'maintenanceFrequencyMonths',
  'lastMaintenanceDate', 'nextMaintenanceDate', 'maintenanceContractEnd', 'poNumber',
  'ipAddress', 'batteryInstallDate', 'batteryReplacementDue', 'loadCapacityKva',
  'runtimeMinutes', 'protectedSystems', 'notes',
];

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(AssetMovement)
    private readonly movementRepo: Repository<AssetMovement>,
    @InjectRepository(AssetVerification)
    private readonly verificationRepo: Repository<AssetVerification>,
    @InjectRepository(AssetDocument)
    private readonly documentRepo: Repository<AssetDocument>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(SoftwareLicense)
    private readonly licenseRepo: Repository<SoftwareLicense>,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  buildRequestActor(user?: User | null, ip?: string | null): AssetActor {
    return {
      userId: user?.id ?? null,
      actorName: user?.fullName ?? user?.email ?? null,
      role: user?.role ?? null,
      ip: ip ?? null,
    };
  }

  private serializeValue(value: unknown): unknown {
    if (value instanceof Date) return value.toISOString();
    return value ?? null;
  }

  private snapshot(asset: Asset): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const field of AUDIT_FIELDS) result[field] = this.serializeValue(asset[field]);
    return result;
  }

  private diff(before: Asset, after: Asset) {
    const changedFields: string[] = [];
    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};
    for (const field of AUDIT_FIELDS) {
      const prev = this.serializeValue(before[field]);
      const next = this.serializeValue(after[field]);
      if (prev === next) continue;
      changedFields.push(field);
      oldValues[field] = prev;
      newValues[field] = next;
    }
    return { changedFields, oldValues, newValues };
  }

  private async logAssetEvent(
    tenantId: string,
    assetId: string | null,
    action: string,
    actor?: AssetActor,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.auditService.log({
      tenantId,
      userId: actor?.userId ?? null,
      action,
      entityType: 'asset',
      entityId: assetId,
      ip: actor?.ip ?? null,
      metadata: {
        actorName: actor?.actorName ?? null,
        actorRole: actor?.role ?? null,
        ...(metadata ?? {}),
      },
    });
  }

  private applyMovement(
    asset: Asset,
    movement: {
      movementType: AssetMovementType;
      toLocation?: string | null;
      toAssignedToUserId?: string | null;
      toAssignedToName?: string | null;
      toDepartment?: string | null;
      newStatus?: AssetStatus | null;
      newCondition?: AssetCondition | null;
    },
  ): Asset {
    const next = this.assetRepo.create({ ...asset });

    if (movement.toLocation !== undefined) next.location = movement.toLocation ?? null;
    if (movement.toAssignedToUserId !== undefined) next.assignedToUserId = movement.toAssignedToUserId ?? null;
    if (movement.toAssignedToName !== undefined) next.assignedToName = movement.toAssignedToName ?? null;
    if (movement.toDepartment !== undefined) next.assignedToDepartment = movement.toDepartment ?? null;
    if (movement.newStatus !== undefined && movement.newStatus !== null) next.status = movement.newStatus;
    if (movement.newCondition !== undefined) next.condition = movement.newCondition ?? null;

    switch (movement.movementType) {
      case 'transfer':
        next.status = movement.newStatus ?? 'in_use';
        break;
      case 'return':
        next.assignedToUserId = movement.toAssignedToUserId ?? null;
        next.assignedToName = movement.toAssignedToName ?? null;
        next.assignedToDepartment = movement.toDepartment ?? null;
        next.status = movement.newStatus ?? 'active';
        break;
      case 'damaged':
        next.condition = movement.newCondition ?? 'damaged';
        next.status = movement.newStatus ?? 'maintenance';
        break;
      case 'disposal':
        next.status = 'disposed';
        break;
      case 'lost':
        next.status = movement.newStatus ?? 'retired';
        break;
      case 'maintenance':
        next.status = movement.newStatus ?? 'maintenance';
        break;
      case 'stock_in':
        next.status = movement.newStatus ?? 'active';
        break;
      default:
        break;
    }

    return next;
  }

  private calculateVerification(asset: Asset, dto: CreateAssetVerificationDto) {
    const actualLocation = dto.actualLocation ?? asset.location ?? null;
    const actualAssignedToName = dto.actualAssignedToName ?? asset.assignedToName ?? null;
    const actualDepartment = dto.actualDepartment ?? asset.assignedToDepartment ?? null;
    const actualStatus = dto.actualStatus ?? asset.status;
    const actualCondition = dto.actualCondition ?? ((asset.condition as AssetCondition | null) ?? null);
    const flags: string[] = [];

    if ((asset.location ?? null) !== actualLocation) flags.push('Location mismatch');
    if ((asset.assignedToName ?? null) !== actualAssignedToName) flags.push('Assignee mismatch');
    if ((asset.assignedToDepartment ?? null) !== actualDepartment) flags.push('Department mismatch');
    if ((asset.status ?? null) !== actualStatus) flags.push('Status mismatch');
    if ((asset.condition ?? null) !== actualCondition) flags.push('Condition mismatch');

    return {
      actualLocation,
      actualAssignedToName,
      actualDepartment,
      actualStatus,
      actualCondition,
      varianceDetected: flags.length > 0,
      varianceSummary: flags.length ? flags.join('; ') : null,
    };
  }

  async create(tenantId: string, dto: CreateAssetDto, actor?: AssetActor): Promise<Asset> {
    const asset = this.assetRepo.create({ ...dto, tenantId });
    const saved = await this.assetRepo.save(asset);
    if (actor) await this.logAssetEvent(tenantId, saved.id, 'asset.created', actor, { snapshot: this.snapshot(saved) });
    return saved;
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

  async update(tenantId: string, id: string, dto: UpdateAssetDto, actor?: AssetActor): Promise<Asset> {
    const before = await this.findOne(tenantId, id);
    await this.assetRepo.update({ id, tenantId }, dto as Partial<Asset>);
    const after = await this.findOne(tenantId, id);
    if (actor) await this.logAssetEvent(tenantId, id, 'asset.updated', actor, this.diff(before, after));
    return after;
  }

  async remove(tenantId: string, id: string, actor?: AssetActor): Promise<void> {
    const asset = await this.findOne(tenantId, id);
    await this.assetRepo.delete({ id, tenantId });
    if (actor) await this.logAssetEvent(tenantId, id, 'asset.deleted', actor, { snapshot: this.snapshot(asset) });
  }

  async getHistory(tenantId: string, id: string): Promise<AuditLog[]> {
    await this.findOne(tenantId, id);
    return this.auditService.findEntityHistory(tenantId, 'asset', id, 100);
  }

  async listMovements(tenantId: string, id: string): Promise<AssetMovement[]> {
    await this.findOne(tenantId, id);
    return this.movementRepo.find({
      where: { tenantId, assetId: id },
      order: { occurredAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async createMovement(tenantId: string, assetId: string, dto: CreateAssetMovementDto, actor: AssetActor): Promise<AssetMovement> {
    if (!ASSET_MOVEMENT_TYPES.includes(dto.movementType)) {
      throw new BadRequestException('Unsupported movement type');
    }
    const asset = await this.findOne(tenantId, assetId);
    const movement = this.movementRepo.create({
      tenantId,
      assetId,
      movementType: dto.movementType,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      quantity: dto.quantity ?? 1,
      fromLocation: asset.location,
      toLocation: dto.toLocation ?? null,
      fromAssignedToUserId: asset.assignedToUserId,
      toAssignedToUserId: dto.toAssignedToUserId ?? null,
      fromAssignedToName: asset.assignedToName,
      toAssignedToName: dto.toAssignedToName ?? null,
      fromDepartment: asset.assignedToDepartment,
      toDepartment: dto.toDepartment ?? null,
      fromStatus: asset.status,
      newStatus: dto.newStatus ?? null,
      fromCondition: asset.condition,
      newCondition: dto.newCondition ?? null,
      reason: dto.reason ?? null,
      notes: dto.notes ?? null,
      approvalRequired: !!dto.approvalRequired,
      approvalStatus: dto.approvalRequired ? 'pending' : 'not_required',
      requestedByUserId: actor.userId ?? null,
      requestedByName: actor.actorName ?? null,
    });
    const saved = await this.movementRepo.save(movement);

    await this.logAssetEvent(tenantId, assetId, 'asset.movement_recorded', actor, {
      movementId: saved.id,
      movementType: saved.movementType,
      approvalStatus: saved.approvalStatus,
      toLocation: saved.toLocation,
      toAssignedToName: saved.toAssignedToName,
      toDepartment: saved.toDepartment,
      newStatus: saved.newStatus,
      newCondition: saved.newCondition,
      reason: saved.reason,
    });

    if (!saved.approvalRequired) {
      const nextAsset = this.applyMovement(asset, {
        movementType: saved.movementType,
        toLocation: saved.toLocation,
        toAssignedToUserId: saved.toAssignedToUserId,
        toAssignedToName: saved.toAssignedToName,
        toDepartment: saved.toDepartment,
        newStatus: saved.newStatus as AssetStatus | null,
        newCondition: saved.newCondition as AssetCondition | null,
      });
      await this.assetRepo.save(nextAsset);
      await this.logAssetEvent(tenantId, assetId, 'asset.movement_applied', actor, {
        movementId: saved.id,
        movementType: saved.movementType,
        ...this.diff(asset, nextAsset),
      });
    }

    return saved;
  }

  async approveMovement(
    tenantId: string,
    assetId: string,
    movementId: string,
    dto: ApproveAssetMovementDto,
    actor: AssetActor,
  ): Promise<AssetMovement> {
    const asset = await this.findOne(tenantId, assetId);
    const movement = await this.movementRepo.findOne({ where: { id: movementId, tenantId, assetId } });
    if (!movement) throw new NotFoundException('Movement not found');
    if (!movement.approvalRequired) throw new BadRequestException('This movement does not require approval');
    if (movement.approvalStatus !== 'pending') throw new BadRequestException('This movement has already been processed');

    movement.approvalStatus = dto.approved ? 'approved' : 'rejected';
    movement.approvedAt = new Date();
    movement.approvedByUserId = actor.userId ?? null;
    movement.approvedByName = actor.actorName ?? null;
    movement.approvalComment = dto.approvalComment ?? null;
    const saved = await this.movementRepo.save(movement);

    await this.logAssetEvent(tenantId, assetId, dto.approved ? 'asset.movement_approved' : 'asset.movement_rejected', actor, {
      movementId: saved.id,
      movementType: saved.movementType,
      approvalComment: saved.approvalComment,
    });

    if (dto.approved) {
      const nextAsset = this.applyMovement(asset, {
        movementType: saved.movementType,
        toLocation: saved.toLocation,
        toAssignedToUserId: saved.toAssignedToUserId,
        toAssignedToName: saved.toAssignedToName,
        toDepartment: saved.toDepartment,
        newStatus: saved.newStatus as AssetStatus | null,
        newCondition: saved.newCondition as AssetCondition | null,
      });
      await this.assetRepo.save(nextAsset);
      await this.logAssetEvent(tenantId, assetId, 'asset.movement_applied', actor, {
        movementId: saved.id,
        movementType: saved.movementType,
        ...this.diff(asset, nextAsset),
      });
    }

    return saved;
  }

  async listVerifications(tenantId: string, id: string): Promise<AssetVerification[]> {
    await this.findOne(tenantId, id);
    return this.verificationRepo.find({
      where: { tenantId, assetId: id },
      order: { checkedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async createVerification(
    tenantId: string,
    assetId: string,
    dto: CreateAssetVerificationDto,
    actor: AssetActor,
  ): Promise<AssetVerification> {
    if (dto.verificationType && !VERIFICATION_TYPES.includes(dto.verificationType)) {
      throw new BadRequestException('Unsupported verification type');
    }
    const asset = await this.findOne(tenantId, assetId);
    const result = this.calculateVerification(asset, dto);
    const verification = this.verificationRepo.create({
      tenantId,
      assetId,
      verificationType: dto.verificationType ?? 'spot_check',
      checkedAt: dto.checkedAt ? new Date(dto.checkedAt) : new Date(),
      checkedByUserId: actor.userId ?? null,
      checkedByName: actor.actorName ?? null,
      systemLocation: asset.location,
      actualLocation: result.actualLocation,
      systemAssignedToName: asset.assignedToName,
      actualAssignedToName: result.actualAssignedToName,
      systemDepartment: asset.assignedToDepartment,
      actualDepartment: result.actualDepartment,
      systemStatus: asset.status,
      actualStatus: result.actualStatus,
      systemCondition: asset.condition,
      actualCondition: result.actualCondition,
      varianceDetected: result.varianceDetected,
      varianceSummary: result.varianceSummary,
      resolved: !result.varianceDetected,
      notes: dto.notes ?? null,
    });
    const saved = await this.verificationRepo.save(verification);
    await this.logAssetEvent(tenantId, assetId, 'asset.verified', actor, {
      verificationId: saved.id,
      verificationType: saved.verificationType,
      varianceDetected: saved.varianceDetected,
      varianceSummary: saved.varianceSummary,
    });
    return saved;
  }

  async resolveVerification(
    tenantId: string,
    assetId: string,
    verificationId: string,
    dto: ResolveAssetVerificationDto,
    actor: AssetActor,
  ): Promise<AssetVerification> {
    await this.findOne(tenantId, assetId);
    const verification = await this.verificationRepo.findOne({ where: { id: verificationId, tenantId, assetId } });
    if (!verification) throw new NotFoundException('Verification record not found');
    if (!verification.varianceDetected) throw new BadRequestException('This verification does not contain a variance');
    verification.resolved = true;
    verification.resolutionNote = dto.resolutionNote;
    verification.resolvedAt = new Date();
    verification.resolvedByUserId = actor.userId ?? null;
    verification.resolvedByName = actor.actorName ?? null;
    const saved = await this.verificationRepo.save(verification);
    await this.logAssetEvent(tenantId, assetId, 'asset.verification_resolved', actor, {
      verificationId: saved.id,
      varianceSummary: saved.varianceSummary,
      resolutionNote: saved.resolutionNote,
    });
    return saved;
  }

  async listDocuments(tenantId: string, assetId: string): Promise<Array<Omit<AssetDocument, 'content'>>> {
    await this.findOne(tenantId, assetId);
    return this.documentRepo.find({
      where: { tenantId, assetId },
      order: { createdAt: 'DESC' },
    }) as Promise<Array<Omit<AssetDocument, 'content'>>>;
  }

  async createDocument(
    tenantId: string,
    assetId: string,
    dto: CreateAssetDocumentDto,
    file: { buffer: Buffer; originalname?: string; mimetype?: string; size?: number },
    actor: AssetActor,
  ): Promise<Omit<AssetDocument, 'content'>> {
    await this.findOne(tenantId, assetId);
    if (!file?.buffer?.length) throw new BadRequestException('A document file is required');
    const document = this.documentRepo.create({
      tenantId,
      assetId,
      documentType: dto.documentType,
      title: dto.title,
      referenceNumber: dto.referenceNumber ?? null,
      fileName: file.originalname || dto.title,
      mimeType: file.mimetype || 'application/octet-stream',
      sizeBytes: file.size ?? file.buffer.length,
      content: file.buffer,
      uploadedByUserId: actor.userId ?? null,
      uploadedByName: actor.actorName ?? null,
      notes: dto.notes ?? null,
    });
    const saved = await this.documentRepo.save(document);
    await this.logAssetEvent(tenantId, assetId, 'asset.document_uploaded', actor, {
      documentId: saved.id,
      documentType: saved.documentType,
      title: saved.title,
      fileName: saved.fileName,
      sizeBytes: saved.sizeBytes,
    });
    const { content, ...safeDocument } = saved;
    return safeDocument;
  }

  async getDocumentContent(tenantId: string, assetId: string, documentId: string): Promise<AssetDocument> {
    await this.findOne(tenantId, assetId);
    const document = await this.documentRepo
      .createQueryBuilder('document')
      .addSelect('document.content')
      .where('document.id = :documentId', { documentId })
      .andWhere('document.tenant_id = :tenantId', { tenantId })
      .andWhere('document.asset_id = :assetId', { assetId })
      .getOne();
    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  async getControlOverview(tenantId: string): Promise<{ summary: Record<string, number> }> {
    const assets = await this.assetRepo.find({ where: { tenantId } });
    const movements = await this.movementRepo.find({ where: { tenantId } });
    const verifications = await this.verificationRepo.find({ where: { tenantId } });
    const documents = await this.documentRepo.find({ where: { tenantId } });

    const now = new Date();
    const last30 = new Date(now.getTime() - 30 * 86400000);
    const last90 = new Date(now.getTime() - 90 * 86400000);
    const documentedAssetIds = new Set(documents.map((document) => document.assetId));
    const verifiedAssetIds = new Set(
      verifications
        .filter((verification) => new Date(verification.checkedAt) >= last90)
        .map((verification) => verification.assetId),
    );

    return {
      summary: {
        totalAssets: assets.length,
        assignedAssets: assets.filter((asset) => !!asset.assignedToName).length,
        documentedAssets: documentedAssetIds.size,
        movementsLast30Days: movements.filter((movement) => new Date(movement.occurredAt) >= last30).length,
        pendingApprovals: movements.filter((movement) => movement.approvalStatus === 'pending').length,
        openVariances: verifications.filter((verification) => verification.varianceDetected && !verification.resolved).length,
        assetsVerifiedLast90Days: verifiedAssetIds.size,
        expiredWarranty: assets.filter((asset) => asset.warrantyEnd && new Date(asset.warrantyEnd) < now).length,
        maintenanceDue: assets.filter((asset) => asset.nextMaintenanceDate && new Date(asset.nextMaintenanceDate) < now).length,
      },
    };
  }

  private csvEscape(value: unknown): string {
    const raw = value == null ? '' : String(value);
    return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
  }

  private csvBuffer(headers: string[], rows: Array<Array<unknown>>): Buffer {
    const lines = [
      headers.map((header) => this.csvEscape(header)).join(','),
      ...rows.map((row) => row.map((cell) => this.csvEscape(cell)).join(',')),
    ];
    return Buffer.from(lines.join('\n'), 'utf-8');
  }

  async getInventoryReports(tenantId: string) {
    const [assets, movements, verifications, documents, auditTrail] = await Promise.all([
      this.assetRepo.find({ where: { tenantId }, order: { assetTag: 'ASC' } }),
      this.movementRepo.find({ where: { tenantId }, order: { occurredAt: 'DESC', createdAt: 'DESC' } }),
      this.verificationRepo.find({ where: { tenantId }, order: { checkedAt: 'DESC', createdAt: 'DESC' } }),
      this.documentRepo.find({ where: { tenantId }, order: { createdAt: 'DESC' } }),
      this.auditRepo.find({ where: { tenantId, entityType: 'asset' }, order: { createdAt: 'DESC' }, take: 500 }),
    ]);

    const documentsByAsset = new Set(documents.map((document) => document.assetId));
    const now = new Date();
    const stockBalanceMap = new Map<string, {
      category: string;
      subtype: string;
      total: number;
      assigned: number;
      maintenance: number;
      available: number;
      disposed: number;
    }>();

    for (const asset of assets) {
      const key = `${asset.type}:${asset.assetSubtype ?? 'none'}`;
      const row = stockBalanceMap.get(key) ?? {
        category: asset.type,
        subtype: asset.assetSubtype ?? 'unspecified',
        total: 0,
        assigned: 0,
        maintenance: 0,
        available: 0,
        disposed: 0,
      };
      row.total += 1;
      if (asset.assignedToName) row.assigned += 1;
      if (asset.status === 'maintenance') row.maintenance += 1;
      if (asset.status === 'disposed') row.disposed += 1;
      if (asset.status === 'active') row.available += 1;
      stockBalanceMap.set(key, row);
    }

    const departmentMap = new Map<string, { department: string; total: number; inUse: number; maintenance: number; disposed: number }>();
    for (const asset of assets) {
      const department = asset.assignedToDepartment || 'Unassigned';
      const row = departmentMap.get(department) ?? { department, total: 0, inUse: 0, maintenance: 0, disposed: 0 };
      row.total += 1;
      if (asset.status === 'in_use') row.inUse += 1;
      if (asset.status === 'maintenance') row.maintenance += 1;
      if (asset.status === 'disposed') row.disposed += 1;
      departmentMap.set(department, row);
    }

    const ageingBuckets = [
      { label: '0-12 months', min: 0, max: 12, count: 0 },
      { label: '13-36 months', min: 13, max: 36, count: 0 },
      { label: '37-60 months', min: 37, max: 60, count: 0 },
      { label: '61+ months', min: 61, max: Number.POSITIVE_INFINITY, count: 0 },
      { label: 'Unknown age', min: -1, max: -1, count: 0 },
    ];

    for (const asset of assets) {
      if (!asset.purchaseDate) {
        ageingBuckets[4].count += 1;
        continue;
      }
      const purchaseDate = new Date(asset.purchaseDate);
      const months = (now.getFullYear() - purchaseDate.getFullYear()) * 12 + (now.getMonth() - purchaseDate.getMonth());
      const bucket = ageingBuckets.find((item) => months >= item.min && months <= item.max) ?? ageingBuckets[4];
      bucket.count += 1;
    }

    const varianceRows = verifications.map((verification) => ({
      id: verification.id,
      assetId: verification.assetId,
      checkedAt: verification.checkedAt,
      varianceDetected: verification.varianceDetected,
      varianceSummary: verification.varianceSummary,
      resolved: verification.resolved,
      resolvedAt: verification.resolvedAt,
      checkedByName: verification.checkedByName,
    }));

    return {
      summary: {
        totalAssets: assets.length,
        assignedAssets: assets.filter((asset) => !!asset.assignedToName).length,
        documentedAssets: documentsByAsset.size,
        movementCount: movements.length,
        openVariances: verifications.filter((verification) => verification.varianceDetected && !verification.resolved).length,
        disposedAssets: assets.filter((asset) => asset.status === 'disposed').length,
      },
      stockBalance: Array.from(stockBalanceMap.values()),
      departmentInventory: Array.from(departmentMap.values()).sort((a, b) => a.department.localeCompare(b.department)),
      movements: movements.map((movement) => ({
        id: movement.id,
        assetId: movement.assetId,
        movementType: movement.movementType,
        occurredAt: movement.occurredAt,
        fromLocation: movement.fromLocation,
        toLocation: movement.toLocation,
        fromAssignedToName: movement.fromAssignedToName,
        toAssignedToName: movement.toAssignedToName,
        approvalStatus: movement.approvalStatus,
        reason: movement.reason,
      })),
      variances: varianceRows,
      disposedItems: assets
        .filter((asset) => asset.status === 'disposed')
        .map((asset) => ({
          id: asset.id,
          assetTag: asset.assetTag,
          name: asset.name,
          location: asset.location,
          assignedToName: asset.assignedToName,
          updatedAt: asset.updatedAt,
        })),
      assetAgeing: ageingBuckets,
      auditTrail: auditTrail.map((entry) => ({
        id: entry.id,
        action: entry.action,
        entityId: entry.entityId,
        userId: entry.userId,
        ip: entry.ip,
        createdAt: entry.createdAt,
      })),
    };
  }

  async exportInventoryReportCsv(tenantId: string, reportType: string): Promise<{ fileName: string; buffer: Buffer }> {
    const reports = await this.getInventoryReports(tenantId);
    switch (reportType) {
      case 'stock-balance':
        return {
          fileName: 'asset-stock-balance.csv',
          buffer: this.csvBuffer(
            ['Category', 'Subtype', 'Total', 'Assigned', 'Available', 'Maintenance', 'Disposed'],
            reports.stockBalance.map((row) => [row.category, row.subtype, row.total, row.assigned, row.available, row.maintenance, row.disposed]),
          ),
        };
      case 'movements':
        return {
          fileName: 'asset-movements.csv',
          buffer: this.csvBuffer(
            ['When', 'Type', 'Asset Id', 'From Location', 'To Location', 'From Assignee', 'To Assignee', 'Approval', 'Reason'],
            reports.movements.map((row) => [row.occurredAt, row.movementType, row.assetId, row.fromLocation, row.toLocation, row.fromAssignedToName, row.toAssignedToName, row.approvalStatus, row.reason]),
          ),
        };
      case 'audit-trail':
        return {
          fileName: 'asset-audit-trail.csv',
          buffer: this.csvBuffer(
            ['When', 'Action', 'Entity Id', 'User Id', 'IP'],
            reports.auditTrail.map((row) => [row.createdAt, row.action, row.entityId, row.userId, row.ip]),
          ),
        };
      case 'variances':
        return {
          fileName: 'asset-variances.csv',
          buffer: this.csvBuffer(
            ['Checked At', 'Asset Id', 'Variance Detected', 'Variance Summary', 'Resolved', 'Resolved At', 'Checked By'],
            reports.variances.map((row) => [row.checkedAt, row.assetId, row.varianceDetected, row.varianceSummary, row.resolved, row.resolvedAt, row.checkedByName]),
          ),
        };
      case 'disposed-items':
        return {
          fileName: 'disposed-assets.csv',
          buffer: this.csvBuffer(
            ['Asset Tag', 'Name', 'Location', 'Assigned To', 'Last Updated'],
            reports.disposedItems.map((row) => [row.assetTag, row.name, row.location, row.assignedToName, row.updatedAt]),
          ),
        };
      case 'department-inventory':
        return {
          fileName: 'department-inventory.csv',
          buffer: this.csvBuffer(
            ['Department', 'Total', 'In Use', 'Maintenance', 'Disposed'],
            reports.departmentInventory.map((row) => [row.department, row.total, row.inUse, row.maintenance, row.disposed]),
          ),
        };
      case 'asset-ageing':
        return {
          fileName: 'asset-ageing.csv',
          buffer: this.csvBuffer(
            ['Age Bucket', 'Count'],
            reports.assetAgeing.map((row) => [row.label, row.count]),
          ),
        };
      default:
        throw new BadRequestException('Unsupported report type');
    }
  }

  async runAlertsForTenant(tenantId: string) {
    const [assets, movements, verifications, managers] = await Promise.all([
      this.assetRepo.find({ where: { tenantId } }),
      this.movementRepo.find({ where: { tenantId }, order: { createdAt: 'DESC' } }),
      this.verificationRepo.find({ where: { tenantId }, order: { checkedAt: 'DESC' } }),
      this.userRepo.find({ where: { tenantId, active: true, role: 'ict_manager' as User['role'] } }),
    ]);

    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86400000);
    const last30 = new Date(now.getTime() - 30 * 86400000);
    const last90 = new Date(now.getTime() - 90 * 86400000);

    const pendingApprovals = movements.filter((movement) => movement.approvalStatus === 'pending').length;
    const unusualAdjustments = movements.filter((movement) => movement.movementType === 'adjustment' && new Date(movement.createdAt) >= last30).length;
    const openVariances = verifications.filter((verification) => verification.varianceDetected && !verification.resolved).length;
    const maintenanceDue = assets.filter((asset) => asset.nextMaintenanceDate && new Date(asset.nextMaintenanceDate) < now).length;
    const warrantyExpiring = assets.filter((asset) => asset.warrantyEnd && new Date(asset.warrantyEnd) <= in30 && new Date(asset.warrantyEnd) >= now).length;
    const verifiedRecently = new Set(
      verifications
        .filter((verification) => new Date(verification.checkedAt) >= last90)
        .map((verification) => verification.assetId),
    );
    const overdueVerification = assets.filter((asset) => !verifiedRecently.has(asset.id)).length;

    for (const manager of managers) {
      if (pendingApprovals > 0) {
        await this.notificationsService.createForUser({
          tenantId,
          userId: manager.id,
          type: 'asset_pending_approvals',
          severity: 'warning',
          title: 'Asset movement approvals pending',
          message: `${pendingApprovals} asset movement requests still require approval.`,
          linkUrl: '/assets',
          externalKey: `asset-pending-approvals:${tenantId}:${pendingApprovals}`,
        });
      }
      if (openVariances > 0) {
        await this.notificationsService.createForUser({
          tenantId,
          userId: manager.id,
          type: 'asset_open_variances',
          severity: 'warning',
          title: 'Asset variances require resolution',
          message: `${openVariances} asset verification variances remain unresolved.`,
          linkUrl: '/assets',
          externalKey: `asset-open-variances:${tenantId}:${openVariances}`,
        });
      }
      if (maintenanceDue > 0) {
        await this.notificationsService.createForUser({
          tenantId,
          userId: manager.id,
          type: 'asset_maintenance_due',
          severity: 'info',
          title: 'Asset maintenance due',
          message: `${maintenanceDue} assets have overdue maintenance dates recorded.`,
          linkUrl: '/assets',
          externalKey: `asset-maintenance-due:${tenantId}:${maintenanceDue}`,
        });
      }
      if (warrantyExpiring > 0) {
        await this.notificationsService.createForUser({
          tenantId,
          userId: manager.id,
          type: 'asset_warranty_expiring',
          severity: 'info',
          title: 'Warranty expiries approaching',
          message: `${warrantyExpiring} assets have warranties expiring within 30 days.`,
          linkUrl: '/assets',
          externalKey: `asset-warranty-expiring:${tenantId}:${warrantyExpiring}`,
        });
      }
      if (overdueVerification > 0) {
        await this.notificationsService.createForUser({
          tenantId,
          userId: manager.id,
          type: 'asset_verification_overdue',
          severity: 'warning',
          title: 'Physical verification overdue',
          message: `${overdueVerification} assets have not been verified within the last 90 days.`,
          linkUrl: '/assets',
          externalKey: `asset-verification-overdue:${tenantId}:${overdueVerification}`,
        });
      }
      if (unusualAdjustments > 0) {
        await this.notificationsService.createForUser({
          tenantId,
          userId: manager.id,
          type: 'asset_unusual_adjustments',
          severity: 'warning',
          title: 'Unusual adjustment activity detected',
          message: `${unusualAdjustments} adjustment movements were recorded in the last 30 days and should be reviewed.`,
          linkUrl: '/assets',
          externalKey: `asset-unusual-adjustments:${tenantId}:${unusualAdjustments}`,
        });
      }
    }

    return {
      pendingApprovals,
      openVariances,
      maintenanceDue,
      warrantyExpiring,
      overdueVerification,
      unusualAdjustments,
      notifiedManagers: managers.length,
    };
  }

  async importFromExcel(
    tenantId: string,
    buffer: Buffer,
    filename?: string,
    actor?: AssetActor,
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
    const rows = allRows.filter((row) => row.some((cell) => String(cell).trim() !== ''));
    if (rows.length < 2) {
      return { created: 0, errors: [{ row: 1, message: `File appears empty or has only a header row (${rows.length} non-empty row(s) found). Please add data rows below the header and try again.` }] };
    }

    let headerIdx = 0;
    const knownHeaders = new Set(Object.keys(HEADER_MAP));
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
      const candidate = rows[i].map((cell) => String(cell).trim().toLowerCase().replace(/\s+/g, ' '));
      if (candidate.some((header) => knownHeaders.has(header))) {
        headerIdx = i;
        break;
      }
    }

    const finalHeaderRow = rows[headerIdx].map((cell) => String(cell).trim().toLowerCase().replace(/\s+/g, ' '));
    const colIndex: Record<string, number> = {};
    finalHeaderRow.forEach((header, i) => {
      const key = HEADER_MAP[header] ?? header.replace(/\s+/g, '');
      if (key) colIndex[key] = i;
    });

    const get = (row: (string | number)[], field: string): string => {
      const i = colIndex[field];
      if (i == null) return '';
      const value = row[i];
      if (value == null) return '';
      return String(value).trim();
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
      const type = CATEGORY_TO_TYPE[categoryRaw] ?? (ASSET_TYPES.includes(typeRaw as AssetType) ? (typeRaw as AssetType) : 'hardware');
      const assetSubtypeRaw = get(row, 'assetSubtype').toLowerCase().trim().replace(/\s+/g, '_');
      const assetSubtype = ASSET_SUBTYPES.includes(assetSubtypeRaw as typeof ASSET_SUBTYPES[number])
        ? assetSubtypeRaw
        : categoryRaw === 'ups'
          ? 'ups'
          : undefined;

      const statusLabelRaw = get(row, 'statusLabel').toLowerCase().trim();
      const statusRaw = get(row, 'status').toLowerCase().trim().replace(/\s+/g, '_');
      let status: AssetStatus = statusLabelRaw
        ? (STATUS_LABEL_MAP[statusLabelRaw] ?? STATUS_LABEL_MAP[statusRaw] ?? 'active')
        : (STATUS_LABEL_MAP[statusRaw] ?? (statusRaw as AssetStatus));
      if (!ASSET_STATUSES.includes(status)) status = 'active';

      const conditionRaw = get(row, 'condition').toLowerCase().trim();
      const condition = ASSET_CONDITIONS.includes(conditionRaw as AssetCondition) ? (conditionRaw as AssetCondition) : undefined;
      const costStr = get(row, 'cost');
      const usefulLifeMonthsStr = get(row, 'usefulLifeMonths');
      const maintenanceFrequencyStr = get(row, 'maintenanceFrequencyMonths');
      const loadCapacityKvaStr = get(row, 'loadCapacityKva');
      const runtimeMinutesStr = get(row, 'runtimeMinutes');

      const dto: CreateAssetDto = {
        assetTag,
        barcode: get(row, 'barcode') || undefined,
        name,
        description: get(row, 'description') || undefined,
        type,
        assetSubtype: assetSubtype as CreateAssetDto['assetSubtype'],
        status,
        condition,
        manufacturer: get(row, 'manufacturer') || undefined,
        model: get(row, 'model') || undefined,
        serialNumber: get(row, 'serialNumber') || undefined,
        ipAddress: get(row, 'ipAddress') || undefined,
        purchaseDate: excelDateToIso(colIndex['purchaseDate'] != null ? row[colIndex['purchaseDate']] : get(row, 'purchaseDate')),
        warrantyEnd: excelDateToIso(colIndex['warrantyEnd'] != null ? row[colIndex['warrantyEnd']] : get(row, 'warrantyEnd')),
        expectedEndOfLife: excelDateToIso(colIndex['expectedEndOfLife'] != null ? row[colIndex['expectedEndOfLife']] : get(row, 'expectedEndOfLife')),
        cost: costStr && !Number.isNaN(parseFloat(costStr)) ? parseFloat(costStr) : undefined,
        usefulLifeMonths: usefulLifeMonthsStr && !Number.isNaN(parseInt(usefulLifeMonthsStr, 10)) ? parseInt(usefulLifeMonthsStr, 10) : undefined,
        supplier: get(row, 'supplier') || undefined,
        maintenanceProvider: get(row, 'maintenanceProvider') || undefined,
        maintenanceFrequencyMonths: maintenanceFrequencyStr && !Number.isNaN(parseInt(maintenanceFrequencyStr, 10)) ? parseInt(maintenanceFrequencyStr, 10) : undefined,
        lastMaintenanceDate: excelDateToIso(colIndex['lastMaintenanceDate'] != null ? row[colIndex['lastMaintenanceDate']] : get(row, 'lastMaintenanceDate')),
        nextMaintenanceDate: excelDateToIso(colIndex['nextMaintenanceDate'] != null ? row[colIndex['nextMaintenanceDate']] : get(row, 'nextMaintenanceDate')),
        maintenanceContractEnd: excelDateToIso(colIndex['maintenanceContractEnd'] != null ? row[colIndex['maintenanceContractEnd']] : get(row, 'maintenanceContractEnd')),
        poNumber: get(row, 'poNumber') || undefined,
        batteryInstallDate: excelDateToIso(colIndex['batteryInstallDate'] != null ? row[colIndex['batteryInstallDate']] : get(row, 'batteryInstallDate')),
        batteryReplacementDue: excelDateToIso(colIndex['batteryReplacementDue'] != null ? row[colIndex['batteryReplacementDue']] : get(row, 'batteryReplacementDue')),
        loadCapacityKva: loadCapacityKvaStr && !Number.isNaN(parseFloat(loadCapacityKvaStr)) ? parseFloat(loadCapacityKvaStr) : undefined,
        runtimeMinutes: runtimeMinutesStr && !Number.isNaN(parseInt(runtimeMinutesStr, 10)) ? parseInt(runtimeMinutesStr, 10) : undefined,
        protectedSystems: get(row, 'protectedSystems') || undefined,
        assignedToName: get(row, 'assignedToName') || undefined,
        assignedToDepartment: get(row, 'assignedToDepartment') || undefined,
        location: get(row, 'location') || undefined,
        notes: get(row, 'notes') || undefined,
      };

      try {
        await this.create(tenantId, dto, actor);
        created++;
      } catch (e) {
        errors.push({ row: r + 1, message: e instanceof Error ? e.message : 'Failed to create asset' });
      }
    }

    if (actor) {
      await this.logAssetEvent(tenantId, null, 'asset.import_completed', actor, {
        filename: filename ?? null,
        created,
        errors,
      });
    }

    return { created, errors };
  }

  getImportTemplateBuffer(): Buffer {
    const ws = XLSX.utils.aoa_to_sheet([
      [
        'Asset Tag',
        'Barcode',
        'Name',
        'Description',
        'Type',
        'Status',
        'Condition',
        'Manufacturer',
        'Model',
        'Serial Number',
        'IP Address',
        'Purchase Date',
        'Warranty Expiry Date',
        'Expected End of Life',
        'Purchase Cost',
        'Useful Life Months',
        'Supplier',
        'PO Number',
        'Assigned To',
        'Department',
        'Location',
        'Notes',
      ],
      [
        'NSA/LAP/001',
        'NSA-LAP-001',
        'Dell Latitude 5520',
        'Primary finance operations laptop',
        'hardware',
        'in_use',
        'good',
        'Dell',
        'Latitude 5520',
        'SN-ABC123456',
        '192.168.1.50',
        '2024-01-15',
        '2027-01-15',
        '2028-01-15',
        '18500',
        '48',
        'Namibia Computer Warehouse',
        'PO-2024-001',
        'John Ndapewa',
        'ICT',
        'Head Office - Room 3B',
        'Snipe-IT / inventory import compatible',
      ],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Assets');
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

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

  async getAssetStats(tenantId: string): Promise<{ total: number; byStatus: Record<string, number>; byType: Record<string, number> }> {
    const list = await this.assetRepo.find({ where: { tenantId } });
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    list.forEach((asset) => {
      byStatus[asset.status] = (byStatus[asset.status] ?? 0) + 1;
      byType[asset.type] = (byType[asset.type] ?? 0) + 1;
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
    const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
    const in30 = addDays(now, 30);
    const in60 = addDays(now, 60);
    const in90 = addDays(now, 90);
    const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
    let expiringSoon = 0;
    let expiringIn30 = 0;
    let expiringIn60 = 0;
    let expiringIn90 = 0;
    let renewalsThisQuarter = 0;
    let overAllocated = 0;
    const expiringIn30Days: Array<{ id: string; softwareName: string; expiryDate: string }> = [];
    const overAllocatedList: Array<{ id: string; softwareName: string; usedSeats: number; totalSeats: number }> = [];
    const renewalsDueThisQuarter: Array<{ id: string; softwareName: string; expiryDate: string }> = [];
    list.forEach((license) => {
      const exp = license.expiryDate ? new Date(license.expiryDate) : null;
      if (exp) {
        exp.setHours(0, 0, 0, 0);
        if (exp >= now && exp <= in30) {
          expiringSoon++;
          expiringIn30++;
          expiringIn30Days.push({ id: license.id, softwareName: license.softwareName, expiryDate: license.expiryDate!.toISOString().slice(0, 10) });
        } else if (exp > in30 && exp <= in60) {
          expiringIn60++;
        } else if (exp > in60 && exp <= in90) {
          expiringIn90++;
        }
        if (exp >= now && exp <= quarterEnd) {
          renewalsThisQuarter++;
          renewalsDueThisQuarter.push({ id: license.id, softwareName: license.softwareName, expiryDate: license.expiryDate!.toISOString().slice(0, 10) });
        }
      }
      if (license.usedSeats > license.totalSeats) {
        overAllocated++;
        overAllocatedList.push({ id: license.id, softwareName: license.softwareName, usedSeats: Number(license.usedSeats), totalSeats: Number(license.totalSeats) });
      }
    });
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
