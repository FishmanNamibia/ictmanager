import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { AssetCondition, AssetStatus, AssetSubtype, AssetType } from '../asset.entity';

const ASSET_TYPES: AssetType[] = ['hardware', 'software', 'network', 'peripheral'];
const ASSET_STATUSES: AssetStatus[] = ['active', 'in_use', 'maintenance', 'retired', 'disposed'];
const ASSET_CONDITIONS: AssetCondition[] = ['new', 'good', 'fair', 'poor', 'damaged'];
const ASSET_SUBTYPES: AssetSubtype[] = ['ups', 'server', 'laptop', 'desktop', 'printer', 'switch', 'router', 'other'];

export class CreateAssetDto {
  @IsString()
  assetTag: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(ASSET_TYPES)
  type: AssetType;

  @IsOptional()
  @IsIn(ASSET_SUBTYPES)
  assetSubtype?: AssetSubtype;

  @IsOptional()
  @IsIn(ASSET_STATUSES)
  status?: AssetStatus;

  @IsOptional()
  @IsIn(ASSET_CONDITIONS)
  condition?: AssetCondition;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsDateString()
  warrantyEnd?: string;

  @IsOptional()
  @IsDateString()
  expectedEndOfLife?: string;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  usefulLifeMonths?: number;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  maintenanceProvider?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maintenanceFrequencyMonths?: number;

  @IsOptional()
  @IsDateString()
  lastMaintenanceDate?: string;

  @IsOptional()
  @IsDateString()
  nextMaintenanceDate?: string;

  @IsOptional()
  @IsDateString()
  maintenanceContractEnd?: string;

  @IsOptional()
  @IsString()
  poNumber?: string;

  @IsOptional()
  @IsDateString()
  batteryInstallDate?: string;

  @IsOptional()
  @IsDateString()
  batteryReplacementDue?: string;

  @IsOptional()
  @IsNumber()
  loadCapacityKva?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  runtimeMinutes?: number;

  @IsOptional()
  @IsString()
  protectedSystems?: string;

  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @IsOptional()
  @IsString()
  assignedToName?: string;

  @IsOptional()
  @IsString()
  assignedToDepartment?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
