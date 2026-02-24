import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

export type AssignmentRole = 'primary' | 'secondary' | 'backup';
export type SupportScope = 'admin' | 'functional' | 'developer' | 'dba' | 'security';
export type CoverageType = 'business_hours' | 'after_hours' | 'both';

@Entity('system_assignments')
@Index(['tenantId'])
@Index(['tenantId', 'staffProfileId'])
export class SystemAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'staff_profile_id' })
  staffProfileId: string;

  @Column({ name: 'system_name' })
  systemName: string;

  /** Optional link to applications.id — not enforced by FK to keep modules loose */
  @Column({ name: 'system_id', type: 'varchar', nullable: true })
  systemId: string | null;

  @Column({ type: 'varchar', length: 20, default: 'primary' })
  role: AssignmentRole;

  @Column({ type: 'varchar', length: 20, nullable: true })
  scope: SupportScope | null;

  @Column({ type: 'varchar', length: 20, nullable: true, default: 'business_hours' })
  coverage: CoverageType | null;

  @Column({ name: 'sla_responsibility', type: 'boolean', default: false })
  slaResponsibility: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
