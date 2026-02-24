import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PolicyDocumentType, PolicyStatus, PolicyType, RiskLevel } from '../policy.entity';

const POLICY_STATUSES: PolicyStatus[] = ['draft', 'approved', 'under_review', 'retired', 'expired'];
const POLICY_TYPES: PolicyType[] = ['acceptable_use', 'security', 'disaster_recovery', 'backup', 'data_protection', 'other'];
const DOCUMENT_TYPES: PolicyDocumentType[] = ['policy', 'standard', 'procedure', 'guideline'];
const RISK_LEVELS: RiskLevel[] = ['high', 'medium', 'low'];

class PolicyAttachmentDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(2048)
  url: string;
}

export class CreatePolicyDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsIn(POLICY_TYPES)
  policyType?: PolicyType;

  @IsOptional()
  @IsIn(DOCUMENT_TYPES)
  policyDocumentType?: PolicyDocumentType;

  @IsOptional()
  @IsIn(POLICY_STATUSES)
  status?: PolicyStatus;

  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  responsibleOwner?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ictOwner?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  approvalAuthority?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  version?: string | null;

  @IsOptional()
  @IsDateString()
  approvalDate?: string | null;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  reviewFrequency?: string | null;

  @IsOptional()
  @IsIn(RISK_LEVELS)
  riskLevel?: RiskLevel | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PolicyAttachmentDto)
  attachments?: PolicyAttachmentDto[] | null;

  @IsOptional()
  @IsDateString()
  lastReviewDate?: string | null;

  @IsOptional()
  @IsDateString()
  nextReviewDue?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  documentUrl?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
