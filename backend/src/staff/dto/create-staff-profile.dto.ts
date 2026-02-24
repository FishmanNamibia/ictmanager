import { IsOptional, IsString, IsBoolean, IsInt, IsIn, IsDateString, Min, Max, IsEmail } from 'class-validator';

const EMPLOYMENT_TYPES = ['permanent', 'contract', 'intern', 'consultant'];
const ROLE_TYPES = ['support', 'dev', 'network', 'security', 'data', 'dba', 'apps', 'helpdesk', 'management'];

export class CreateStaffProfileDto {
  @IsString()
  fullName: string;

  @IsOptional() @IsString() employeeNumber?: string;
  @IsOptional() @IsString() jobTitle?: string;
  @IsOptional() @IsString() grade?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsIn(EMPLOYMENT_TYPES) employmentType?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsString() supervisorName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() reportsToUserId?: string;

  @IsOptional() @IsIn(ROLE_TYPES) roleType?: string;
  @IsOptional() @IsBoolean() onCallEligible?: boolean;
  @IsOptional() @IsString() shiftHours?: string;

  @IsOptional() @IsInt() @Min(0) @Max(100) operationalPercent?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100) projectsPercent?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100) adminPercent?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100) trainingPercent?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100) capacityPercent?: number;

  @IsOptional() @IsString() pdpNotes?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() notes?: string;
}
