import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ApproveAssetMovementDto {
  @IsBoolean()
  approved: boolean;

  @IsOptional()
  @IsString()
  approvalComment?: string;
}
