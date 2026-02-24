import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { PolicyCategory } from './policy-category.entity';
import { Application } from '../applications/application.entity';
import { Asset } from '../assets/asset.entity';
import { SoftwareLicense } from '../assets/software-license.entity';

export type PolicyStatus = 'draft' | 'approved' | 'under_review' | 'retired' | 'expired';
export type PolicyType =
  | 'acceptable_use'
  | 'security'
  | 'disaster_recovery'
  | 'backup'
  | 'data_protection'
  | 'other';

export type PolicyDocumentType = 'policy' | 'standard' | 'procedure' | 'guideline';

export type RiskLevel = 'high' | 'medium' | 'low';

@Entity('policies')
@Index(['tenantId'])
@Index(['tenantId', 'status'])
export class Policy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'policy_type', type: 'varchar', length: 50, default: 'other' })
  policyType: PolicyType;

  @Column({ name: 'policy_document_type', type: 'varchar', length: 20, default: 'policy' })
  policyDocumentType: PolicyDocumentType;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: PolicyStatus;

  @ManyToOne(() => PolicyCategory, { nullable: true, eager: true })
  @JoinColumn({ name: 'category_id' })
  category?: PolicyCategory | null;

  @Column({ name: 'responsible_owner', type: 'varchar', nullable: true })
  responsibleOwner: string | null;

  @Column({ name: 'ict_owner', type: 'varchar', nullable: true })
  ictOwner: string | null;

  @Column({ name: 'approval_authority', type: 'varchar', length: 255, nullable: true })
  approvalAuthority: string | null;

  @Column({ name: 'version', type: 'varchar', length: 50, nullable: true })
  version: string | null;

  @Column({ name: 'approval_date', type: 'date', nullable: true })
  approvalDate: Date | null;

  @Column({ name: 'effective_date', type: 'date', nullable: true })
  effectiveDate: Date | null;

  @Column({ name: 'review_frequency', type: 'varchar', length: 50, nullable: true })
  reviewFrequency: string | null;

  @Column({ name: 'risk_level', type: 'varchar', length: 10, nullable: true })
  riskLevel: RiskLevel | null;

  @Column({ name: 'attachments', type: 'simple-json', nullable: true })
  attachments: Array<{ name: string; url: string }> | null;

  @ManyToMany(() => Application)
  @JoinTable({ name: 'policy_applications', joinColumn: { name: 'policy_id' }, inverseJoinColumn: { name: 'application_id' } })
  applications?: Application[];

  @ManyToMany(() => Asset)
  @JoinTable({ name: 'policy_assets', joinColumn: { name: 'policy_id' }, inverseJoinColumn: { name: 'asset_id' } })
  assets?: Asset[];

  @ManyToMany(() => SoftwareLicense)
  @JoinTable({ name: 'policy_software_licenses', joinColumn: { name: 'policy_id' }, inverseJoinColumn: { name: 'license_id' } })
  softwareLicenses?: SoftwareLicense[];

  @Column({ name: 'last_review_date', type: 'date', nullable: true })
  lastReviewDate: Date | null;

  @Column({ name: 'next_review_due', type: 'date', nullable: true })
  nextReviewDue: Date | null;

  @Column({ name: 'document_url', type: 'varchar', nullable: true })
  documentUrl: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
