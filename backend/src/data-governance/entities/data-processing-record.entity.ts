import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';

export enum ProcessingPurpose {
  BUSINESS_OPERATIONS = 'business_operations',
  ANALYTICS = 'analytics',
  COMPLIANCE = 'compliance',
  MARKETING = 'marketing',
  RESEARCH = 'research',
  OTHER = 'other',
}

export enum ConsentStatus {
  OBTAINED = 'obtained',
  PENDING = 'pending',
  REFUSED = 'refused',
  EXPIRED = 'expired',
}

@Entity('data_processing_records')
export class DataProcessingRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  dataAssets: string; // Comma-separated list of asset names

  @Column({ type: 'enum', enum: ProcessingPurpose })
  purpose: ProcessingPurpose;

  @Column({ type: 'varchar', length: 255, nullable: true })
  processor: string; // Organization or person doing the processing

  @Column({ type: 'varchar', length: 500, nullable: true })
  recipients: string; // Who the data is shared with

  @Column({ type: 'enum', enum: ConsentStatus, default: ConsentStatus.OBTAINED })
  consentStatus: ConsentStatus;

  @Column({ type: 'int', nullable: true })
  affectedDataSubjects: number; // Number of individuals

  @Column({ type: 'text', nullable: true })
  securityMeasures: string; // Encryption, pseudonymization, etc.

  @Column({ type: 'timestamp', nullable: true })
  retentionUntil: Date;

  @Column({ type: 'boolean', default: false })
  dpia: boolean; // Data Protection Impact Assessment done?

  @Column({ type: 'timestamp', nullable: true })
  dpiaDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
