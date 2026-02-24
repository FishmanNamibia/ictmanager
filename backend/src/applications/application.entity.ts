import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

export type HostingType = 'on_prem' | 'cloud' | 'vendor' | 'hybrid';
export type Criticality = 'critical' | 'high' | 'medium' | 'low';
export type AppStatus = 'proposed' | 'in_development' | 'live' | 'deprecated' | 'retired';
export type AppType = 'custom_built' | 'cots' | 'saas' | 'legacy' | 'open_source';
export type AppTier = 'tier1' | 'tier2' | 'tier3';
export type DataSensitivity = 'public' | 'internal' | 'confidential' | 'restricted';
export type LifecycleStage = 'build' | 'run' | 'optimize' | 'retire';
export type SupportModel = 'in_house' | 'vendor_sla' | 'hybrid';

@Entity('applications')
@Index(['tenantId'])
@Index(['tenantId', 'healthStatus'])
@Index(['tenantId', 'status'])
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  // ── A) Basic Identity ─────────────────────────────────────────────────
  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  acronym: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  category: string | null;          // ERP, HR, Finance, Statistics, etc.

  @Column({ name: 'app_type', type: 'varchar', length: 20, nullable: true })
  appType: AppType | null;

  @Column({ type: 'varchar', length: 20, default: 'live' })
  status: AppStatus;

  @Column({ name: 'go_live_date', type: 'date', nullable: true })
  goLiveDate: Date | null;

  @Column({ type: 'varchar', nullable: true })
  version: string | null;

  // ── B) Ownership ─────────────────────────────────────────────────────
  @Column({ name: 'business_owner', type: 'varchar', nullable: true })
  businessOwner: string | null;

  @Column({ name: 'system_owner', type: 'varchar', nullable: true })
  systemOwner: string | null;

  @Column({ name: 'ict_owner', type: 'varchar', nullable: true })
  ictOwner: string | null;

  @Column({ name: 'support_team', type: 'varchar', nullable: true })
  supportTeam: string | null;

  @Column({ name: 'vendor_name', type: 'varchar', nullable: true })
  vendorName: string | null;

  @Column({ name: 'support_model', type: 'varchar', length: 20, nullable: true })
  supportModel: SupportModel | null;

  // ── C) Criticality & Classification ──────────────────────────────────
  @Column({ type: 'varchar', length: 20, default: 'medium' })
  criticality: Criticality;

  @Column({ type: 'varchar', length: 10, nullable: true })
  tier: AppTier | null;

  @Column({ name: 'data_sensitivity', type: 'varchar', length: 20, nullable: true })
  dataSensitivity: DataSensitivity | null;

  @Column({ name: 'availability_requirement', type: 'varchar', nullable: true })
  availabilityRequirement: string | null;   // e.g. "99.5%"

  @Column({ type: 'varchar', nullable: true })
  rto: string | null;

  @Column({ type: 'varchar', nullable: true })
  rpo: string | null;

  // ── D) Hosting & Infrastructure ───────────────────────────────────────
  @Column({ name: 'hosting_type', type: 'varchar', length: 20, default: 'on_prem' })
  hostingType: HostingType;

  @Column({ type: 'varchar', nullable: true })
  environments: string | null;    // comma-separated: dev,test,uat,prod

  @Column({ name: 'data_center', type: 'varchar', nullable: true })
  dataCenter: string | null;

  @Column({ name: 'database_type', type: 'varchar', nullable: true })
  databaseType: string | null;

  @Column({ name: 'domain_url', type: 'varchar', nullable: true })
  domainUrl: string | null;

  @Column({ type: 'text', nullable: true })
  integrations: string | null;    // comma-separated: AD, Email, SMS, etc.

  @Column({ type: 'text', nullable: true })
  dependencies: string | null;

  // ── E) Security & Compliance ──────────────────────────────────────────
  @Column({ name: 'auth_method', type: 'varchar', nullable: true })
  authMethod: string | null;       // local, ad, sso, mfa

  @Column({ name: 'access_control', type: 'varchar', nullable: true })
  accessControl: string | null;    // rbac, abac

  @Column({ name: 'audit_logging', type: 'boolean', default: false })
  auditLogging: boolean;

  @Column({ name: 'audit_retention_days', type: 'int', nullable: true })
  auditRetentionDays: number | null;

  @Column({ name: 'encryption_at_rest', type: 'boolean', default: false })
  encryptionAtRest: boolean;

  @Column({ name: 'encryption_in_transit', type: 'boolean', default: false })
  encryptionInTransit: boolean;

  @Column({ name: 'compliance_tags', type: 'varchar', nullable: true })
  complianceTags: string | null;

  @Column({ name: 'last_security_review', type: 'date', nullable: true })
  lastSecurityReview: Date | null;

  @Column({ name: 'vulnerability_status', type: 'varchar', nullable: true, default: 'unknown' })
  vulnerabilityStatus: string | null;   // clean, issues_open, unknown

  // ── F) Lifecycle & Roadmap ────────────────────────────────────────────
  @Column({ name: 'lifecycle_stage', type: 'varchar', length: 20, nullable: true })
  lifecycleStage: LifecycleStage | null;

  @Column({ name: 'end_of_support_date', type: 'date', nullable: true })
  endOfSupportDate: Date | null;

  @Column({ name: 'planned_upgrade_date', type: 'date', nullable: true })
  plannedUpgradeDate: Date | null;

  @Column({ name: 'planned_replacement', type: 'varchar', nullable: true })
  plannedReplacement: string | null;

  // ── G) Financial & Contracting ────────────────────────────────────────
  @Column({ name: 'annual_maintenance_cost', type: 'decimal', precision: 14, scale: 2, nullable: true })
  annualMaintenanceCost: number | null;

  @Column({ name: 'contract_start_date', type: 'date', nullable: true })
  contractStartDate: Date | null;

  @Column({ name: 'contract_end_date', type: 'date', nullable: true })
  contractEndDate: Date | null;

  @Column({ name: 'procurement_ref', type: 'varchar', nullable: true })
  procurementRef: string | null;

  @Column({ name: 'vendor_sla_level', type: 'varchar', nullable: true })
  vendorSlaLevel: string | null;

  // ── H) Health inputs (set manually or via monitoring feed) ────────────
  @Column({ name: 'health_status', type: 'varchar', default: 'unknown' })
  healthStatus: string;

  @Column({ name: 'uptime_percent', type: 'decimal', precision: 5, scale: 2, nullable: true })
  uptimePercent: number | null;   // e.g. 99.7

  @Column({ name: 'open_incidents', type: 'int', default: 0 })
  openIncidents: number;

  @Column({ name: 'open_security_issues', type: 'int', default: 0 })
  openSecurityIssues: number;

  @Column({ name: 'backup_success_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
  backupSuccessRate: number | null;

  @Column({ name: 'last_review_date', type: 'date', nullable: true })
  lastReviewDate: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
