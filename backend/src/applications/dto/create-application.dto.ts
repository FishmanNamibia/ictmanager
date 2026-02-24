import { IsIn, IsOptional, IsString, IsNumber, IsBoolean, IsDateString, Min, Max } from 'class-validator';

const HOSTING_TYPES = ['on_prem', 'cloud', 'vendor', 'hybrid'];
const CRITICALITIES = ['critical', 'high', 'medium', 'low'];
const APP_STATUSES = ['proposed', 'in_development', 'live', 'deprecated', 'retired'];
const APP_TYPES = ['custom_built', 'cots', 'saas', 'legacy', 'open_source'];
const TIERS = ['tier1', 'tier2', 'tier3'];
const DATA_SENSITIVITIES = ['public', 'internal', 'confidential', 'restricted'];
const LIFECYCLE_STAGES = ['build', 'run', 'optimize', 'retire'];
const SUPPORT_MODELS = ['in_house', 'vendor_sla', 'hybrid'];

export class CreateApplicationDto {
  @IsString()
  name: string;

  @IsOptional() @IsString() acronym?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsIn(APP_TYPES) appType?: string;
  @IsOptional() @IsIn(APP_STATUSES) status?: string;
  @IsOptional() @IsDateString() goLiveDate?: string;
  @IsOptional() @IsString() version?: string;

  // Ownership
  @IsOptional() @IsString() businessOwner?: string;
  @IsOptional() @IsString() systemOwner?: string;
  @IsOptional() @IsString() ictOwner?: string;
  @IsOptional() @IsString() supportTeam?: string;
  @IsOptional() @IsString() vendorName?: string;
  @IsOptional() @IsIn(SUPPORT_MODELS) supportModel?: string;

  // Criticality
  @IsOptional() @IsIn(CRITICALITIES) criticality?: string;
  @IsOptional() @IsIn(TIERS) tier?: string;
  @IsOptional() @IsIn(DATA_SENSITIVITIES) dataSensitivity?: string;
  @IsOptional() @IsString() availabilityRequirement?: string;
  @IsOptional() @IsString() rto?: string;
  @IsOptional() @IsString() rpo?: string;

  // Hosting
  @IsOptional() @IsIn(HOSTING_TYPES) hostingType?: string;
  @IsOptional() @IsString() environments?: string;
  @IsOptional() @IsString() dataCenter?: string;
  @IsOptional() @IsString() databaseType?: string;
  @IsOptional() @IsString() domainUrl?: string;
  @IsOptional() @IsString() integrations?: string;
  @IsOptional() @IsString() dependencies?: string;

  // Security
  @IsOptional() @IsString() authMethod?: string;
  @IsOptional() @IsString() accessControl?: string;
  @IsOptional() @IsBoolean() auditLogging?: boolean;
  @IsOptional() @IsNumber() @Min(0) auditRetentionDays?: number;
  @IsOptional() @IsBoolean() encryptionAtRest?: boolean;
  @IsOptional() @IsBoolean() encryptionInTransit?: boolean;
  @IsOptional() @IsString() complianceTags?: string;
  @IsOptional() @IsDateString() lastSecurityReview?: string;
  @IsOptional() @IsString() vulnerabilityStatus?: string;

  // Lifecycle
  @IsOptional() @IsIn(LIFECYCLE_STAGES) lifecycleStage?: string;
  @IsOptional() @IsDateString() endOfSupportDate?: string;
  @IsOptional() @IsDateString() plannedUpgradeDate?: string;
  @IsOptional() @IsString() plannedReplacement?: string;

  // Financial
  @IsOptional() @IsNumber() @Min(0) annualMaintenanceCost?: number;
  @IsOptional() @IsDateString() contractStartDate?: string;
  @IsOptional() @IsDateString() contractEndDate?: string;
  @IsOptional() @IsString() procurementRef?: string;
  @IsOptional() @IsString() vendorSlaLevel?: string;

  // Health inputs
  @IsOptional() @IsString() healthStatus?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) uptimePercent?: number;
  @IsOptional() @IsNumber() @Min(0) openIncidents?: number;
  @IsOptional() @IsNumber() @Min(0) openSecurityIssues?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) backupSuccessRate?: number;
  @IsOptional() @IsDateString() lastReviewDate?: string;

  @IsOptional() @IsString() notes?: string;
}
