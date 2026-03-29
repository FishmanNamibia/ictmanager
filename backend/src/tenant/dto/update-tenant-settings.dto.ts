import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsHexColor,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TENANT_MODULE_IDS, TenantModuleId } from '../tenant-settings';

class BrandingSettingsDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  organizationName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  systemName?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @IsString()
  loginHeadline?: string;

  @IsOptional()
  @IsString()
  loginSubtext?: string;
}

class ThemeSettingsDto {
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @IsOptional()
  @IsHexColor()
  backgroundColor?: string;
}

class ModulesSettingsDto {
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(TENANT_MODULE_IDS, { each: true })
  enabled?: TenantModuleId[];
}

export class UpdateTenantSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => BrandingSettingsDto)
  branding?: BrandingSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ThemeSettingsDto)
  theme?: ThemeSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ModulesSettingsDto)
  modules?: ModulesSettingsDto;

  @IsOptional()
  @IsObject()
  access?: {
    roleModules?: Partial<Record<string, TenantModuleId[]>>;
  };
}
