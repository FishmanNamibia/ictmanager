import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';

export enum RiskLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum RiskStatus {
  IDENTIFIED = 'identified',
  MITIGATING = 'mitigating',
  MONITORED = 'monitored',
  RESOLVED = 'resolved',
}

@Entity('ict_risks')
export class IctRisk {
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

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string; // e.g. data_breach, malware, unauthorized_access, ddos, infrastructure

  @Column({ type: 'enum', enum: RiskLevel })
  likelihood: RiskLevel; // Probability of occurrence

  @Column({ type: 'enum', enum: RiskLevel })
  impact: RiskLevel; // Consequence if it occurs

  @Column({ type: 'enum', enum: RiskLevel })
  overallRisk: RiskLevel; // Calculated or assigned overall risk

  @Column({ type: 'enum', enum: RiskStatus, default: RiskStatus.IDENTIFIED })
  status: RiskStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  mitigation: string; // Mitigation strategy or controls

  @Column({ type: 'text', nullable: true })
  owner: string; // Responsible person or team

  @Column({ type: 'timestamp', nullable: true })
  reviewDue: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
