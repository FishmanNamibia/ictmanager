import { IsOptional, IsString, IsNumber, IsDateString, IsIn, Min } from 'class-validator';

const LICENSE_TYPES = ['per_user', 'per_device', 'concurrent', 'perpetual', 'subscription', 'site', 'enterprise', 'oem'];
const CATEGORIES = ['os', 'productivity', 'security', 'erp', 'database', 'development', 'communication', 'other'];
const CRITICALITIES = ['high', 'medium', 'low'];

export class CreateLicenseDto {
  @IsString()
  softwareName: string;

  @IsOptional()
  @IsIn(CATEGORIES)
  softwareCategory?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsString()
  vendorName?: string;

  @IsOptional()
  @IsIn(LICENSE_TYPES)
  licenseType?: string;

  @IsOptional()
  @IsString()
  licenseKey?: string;

  @IsOptional()
  @IsString()
  contractRef?: string;

  @IsOptional()
  @IsString()
  procurementRef?: string;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsDateString()
  supportEndDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  totalSeats?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  usedSeats?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPerSeat?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  businessOwner?: string;

  @IsOptional()
  @IsString()
  ictOwner?: string;

  @IsOptional()
  @IsIn(CRITICALITIES)
  criticality?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
