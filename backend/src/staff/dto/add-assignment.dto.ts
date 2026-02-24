import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator';

const ROLES = ['primary','secondary','backup'];
const SCOPES = ['admin','functional','developer','dba','security'];
const COVERAGE = ['business_hours','after_hours','both'];

export class AddAssignmentDto {
  @IsString()
  systemName: string;

  @IsOptional() @IsString() systemId?: string;
  @IsOptional() @IsIn(ROLES) role?: string;
  @IsOptional() @IsIn(SCOPES) scope?: string;
  @IsOptional() @IsIn(COVERAGE) coverage?: string;
  @IsOptional() @IsBoolean() slaResponsibility?: boolean;
  @IsOptional() @IsString() notes?: string;
}
