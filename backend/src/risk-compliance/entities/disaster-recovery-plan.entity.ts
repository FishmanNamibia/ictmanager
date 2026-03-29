import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';

@Entity('disaster_recovery_plans')
export class DisasterRecoveryPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ type: 'uuid', nullable: true })
  applicationId: string | null;

  @Column({ type: 'varchar', length: 255 })
  planName: string;

  @Column({ type: 'varchar', length: 30, default: 'draft' })
  status: string;

  @Column({ type: 'varchar', length: 20, default: 'warm' })
  recoveryTier: string;

  @Column({ type: 'varchar', length: 30, default: 'manual' })
  failoverType: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recoverySite: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  alternateSite: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recoveryOwner: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  communicationOwner: string | null;

  @Column({ type: 'text', nullable: true })
  activationTrigger: string | null;

  @Column({ type: 'text', nullable: true })
  backupStrategy: string | null;

  @Column({ type: 'text', nullable: true })
  replicationScope: string | null;

  @Column({ type: 'text', nullable: true })
  dependencies: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  runbookUrl: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastDrTestDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  nextDrTestDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastBackupVerificationDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  nextBackupVerificationDate: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
