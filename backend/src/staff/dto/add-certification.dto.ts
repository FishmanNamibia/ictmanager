import { IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';

export class AddCertificationDto {
  @IsString()
  certName: string;

  @IsOptional() @IsString() provider?: string;
  @IsOptional() @IsString() certLevel?: string;
  @IsOptional() @IsDateString() attainedDate?: string;
  @IsOptional() @IsDateString() expiryDate?: string;
  @IsOptional() @IsBoolean() mandatory?: boolean;
  @IsOptional() @IsString() notes?: string;
}
