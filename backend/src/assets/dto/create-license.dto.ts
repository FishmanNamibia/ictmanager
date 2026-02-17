import { IsOptional, IsString, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateLicenseDto {
  @IsString()
  softwareName: string;

  @IsOptional()
  @IsString()
  licenseKey?: string;

  @IsOptional()
  @IsString()
  licenseType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalSeats?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  usedSeats?: number;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  vendorName?: string;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
