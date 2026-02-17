import { IsOptional, IsString, IsUUID, IsInt, Min, Max } from 'class-validator';

export class CreateStaffProfileDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsUUID()
  reportsToUserId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  capacityPercent?: number;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
