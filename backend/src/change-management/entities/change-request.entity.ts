import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';
import { ReleaseRecord } from './release-record.entity';

@Entity('change_requests')
export class ChangeRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 50 })
  changeNumber: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  category: string | null;

  @Column({ type: 'varchar', length: 20, default: 'medium' })
  riskLevel: string;

  @Column({ type: 'varchar', length: 20, default: 'medium' })
  impactLevel: string;

  @Column({ type: 'varchar', length: 30, default: 'requested' })
  status: string;

  @Column({ type: 'varchar', length: 255 })
  requestedBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  approver: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  assignedTo: string | null;

  @Column({ type: 'timestamp', nullable: true })
  plannedStart: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  plannedEnd: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  actualStart: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  actualEnd: Date | null;

  @Column({ type: 'boolean', default: false })
  outageExpected: boolean;

  @Column({ type: 'boolean', default: false })
  businessApproval: boolean;

  @Column({ type: 'text', nullable: true })
  rollbackPlan: string | null;

  @Column({ type: 'text', nullable: true })
  testPlan: string | null;

  @Column({ type: 'text', nullable: true })
  implementationNotes: string | null;

  @OneToMany(() => ReleaseRecord, (release) => release.changeRequest, { cascade: false })
  releases: ReleaseRecord[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

