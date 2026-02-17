import { IsIn, IsOptional, IsString } from 'class-validator';
import { HostingType, Criticality } from '../application.entity';

const HOSTING_TYPES: HostingType[] = ['on_prem', 'cloud', 'vendor', 'hybrid'];
const CRITICALITIES: Criticality[] = ['critical', 'high', 'medium', 'low'];

export class CreateApplicationDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  businessOwner?: string;

  @IsOptional()
  @IsString()
  ictOwner?: string;

  @IsOptional()
  @IsIn(HOSTING_TYPES)
  hostingType?: HostingType;

  @IsOptional()
  @IsIn(CRITICALITIES)
  criticality?: Criticality;

  @IsOptional()
  @IsString()
  healthStatus?: string;

  @IsOptional()
  @IsString()
  vendorName?: string;

  @IsOptional()
  @IsString()
  dependencies?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
