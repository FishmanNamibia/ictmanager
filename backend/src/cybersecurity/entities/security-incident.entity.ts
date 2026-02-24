import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';
import { IncidentEvidence } from './incident-evidence.entity';

export enum IncidentSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

export enum IncidentStatus {
  REPORTED = 'reported',
  INVESTIGATING = 'investigating',
  CONTAINED = 'contained',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

@Entity('security_incidents')
export class SecurityIncident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: IncidentSeverity })
  severity: IncidentSeverity;

  @Column({ type: 'enum', enum: IncidentStatus, default: IncidentStatus.REPORTED })
  status: IncidentStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reportedBy: string; // User email or name

  @Column({ type: 'timestamp', nullable: true })
  dateDetected: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateReported: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateContained: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateResolved: Date;

  @Column({ type: 'text', nullable: true })
  rootCause: string;

  @Column({ type: 'text', nullable: true })
  remediation: string;

  @Column({ type: 'simple-array', nullable: true })
  affectedSystems: string[]; // List of affected application/asset names

  @Column({ type: 'integer', default: 0 })
  affectedUsersCount: number;

  @OneToMany(() => IncidentEvidence, (evidence) => evidence.incident, { cascade: true })
  evidence: IncidentEvidence[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
