import { IsIn, IsOptional, IsString, IsNumber, IsDateString, IsUUID } from 'class-validator';
import { AssetType, AssetStatus } from '../asset.entity';

const ASSET_TYPES: AssetType[] = ['hardware', 'software', 'network', 'peripheral'];
const ASSET_STATUSES: AssetStatus[] = ['active', 'in_use', 'maintenance', 'retired', 'disposed'];

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
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

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
  @IsUUID()
  assignedToUserId?: string;

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
