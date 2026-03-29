import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { AssetCondition, AssetStatus } from '../asset.entity';
import { AssetVerificationType } from '../asset-verification.entity';

const VERIFICATION_TYPES: AssetVerificationType[] = ['spot_check', 'stock_take', 'handover'];
const ASSET_STATUSES: AssetStatus[] = ['active', 'in_use', 'maintenance', 'retired', 'disposed'];
const ASSET_CONDITIONS: AssetCondition[] = ['new', 'good', 'fair', 'poor', 'damaged'];

export class CreateAssetVerificationDto {
  @IsOptional()
  @IsIn(VERIFICATION_TYPES)
  verificationType?: AssetVerificationType;

  @IsOptional()
  @IsDateString()
  checkedAt?: string;

  @IsOptional()
  @IsString()
  actualLocation?: string;

  @IsOptional()
  @IsString()
  actualAssignedToName?: string;

  @IsOptional()
  @IsString()
  actualDepartment?: string;

  @IsOptional()
  @IsIn(ASSET_STATUSES)
  actualStatus?: AssetStatus;

  @IsOptional()
  @IsIn(ASSET_CONDITIONS)
  actualCondition?: AssetCondition;

  @IsOptional()
  @IsString()
  notes?: string;
}
