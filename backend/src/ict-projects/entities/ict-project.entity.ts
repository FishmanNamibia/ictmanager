import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';
import { ProjectMilestone } from './project-milestone.entity';

export enum ProjectStatus {
  PLANNING = 'planning',
  APPROVED = 'approved',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ProjectPhase {
  INITIATION = 'initiation',
  PLANNING = 'planning',
  EXECUTION = 'execution',
  MONITORING = 'monitoring',
  CLOSURE = 'closure',
}

@Entity('ict_projects')
export class IctProject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.PLANNING })
  status: ProjectStatus;

  @Column({ type: 'enum', enum: ProjectPhase, default: ProjectPhase.INITIATION })
  currentPhase: ProjectPhase;

  @Column({ type: 'varchar', length: 255, nullable: true })
  projectManager: string; // Email

  @Column({ type: 'varchar', length: 255, nullable: true })
  sponsor: string; // Executive sponsor email

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  plannedEndDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualEndDate: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  budget: string; // e.g., "50000 EUR"

  @Column({ type: 'varchar', length: 500, nullable: true })
  scope: string; // Brief scope summary

  @Column({ type: 'integer', default: 0 })
  completionPercentage: number; // 0-100

  @Column({ type: 'text', nullable: true })
  objectives: string; // Comma-separated or bullet list

  @Column({ type: 'text', nullable: true })
  deliverables: string;

  @Column({ type: 'text', nullable: true })
  risks: string; // Known risks and mitigation

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => ProjectMilestone, (milestone) => milestone.project, { cascade: true })
  milestones: ProjectMilestone[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
