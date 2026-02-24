import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';

@Entity('risk_register_items')
export class RiskRegisterItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 40, default: 'operations' })
  domain: string;

  @Column({ type: 'int', default: 3 })
  likelihood: number;

  @Column({ type: 'int', default: 3 })
  impact: number;

  @Column({ type: 'int', default: 9 })
  riskScore: number;

  @Column({ type: 'int', nullable: true })
  residualRiskScore: number | null;

  @Column({ type: 'varchar', length: 30, default: 'open' })
  status: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  owner: string | null;

  @Column({ type: 'text', nullable: true })
  mitigation: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reviewFrequency: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastReviewDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  nextReviewDate: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  complianceArea: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

