import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { AssetCondition, AssetStatus } from '../asset.entity';
import { AssetMovementType } from '../asset-movement.entity';

const MOVEMENT_TYPES: AssetMovementType[] = [
  'stock_in',
  'stock_out',
  'transfer',
  'return',
  'adjustment',
  'damaged',
  'lost',
  'disposal',
  'maintenance',
];

const ASSET_STATUSES: AssetStatus[] = ['active', 'in_use', 'maintenance', 'retired', 'disposed'];
const ASSET_CONDITIONS: AssetCondition[] = ['new', 'good', 'fair', 'poor', 'damaged'];

export class CreateAssetMovementDto {
  @IsIn(MOVEMENT_TYPES)
  movementType: AssetMovementType;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  toLocation?: string;

  @IsOptional()
  @IsUUID()
  toAssignedToUserId?: string;

  @IsOptional()
  @IsString()
  toAssignedToName?: string;

  @IsOptional()
  @IsString()
  toDepartment?: string;

  @IsOptional()
  @IsIn(ASSET_STATUSES)
  newStatus?: AssetStatus;

  @IsOptional()
  @IsIn(ASSET_CONDITIONS)
  newCondition?: AssetCondition;

  @IsOptional()
  @IsBoolean()
  approvalRequired?: boolean;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
