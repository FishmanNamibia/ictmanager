import { IsIn, IsOptional, IsString, IsNumber, IsDateString, IsUUID } from 'class-validator';
import { AssetType, AssetStatus, AssetCondition } from '../asset.entity';

const ASSET_TYPES: AssetType[] = ['hardware', 'software', 'network', 'peripheral'];
const ASSET_STATUSES: AssetStatus[] = ['active', 'in_use', 'maintenance', 'retired', 'disposed'];
const ASSET_CONDITIONS: AssetCondition[] = ['new', 'good', 'fair', 'poor', 'damaged'];

export class CreateAssetDto {
  @IsString()
  assetTag: string;

  @IsString()
  name: string;

  @IsIn(ASSET_TYPES)
  type: AssetType;

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
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  poNumber?: string;

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
