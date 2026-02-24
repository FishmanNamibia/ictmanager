import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';

@Entity('data_quality_metrics')
export class DataQualityMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 255 })
  dataAssetName: string;

  @Column({ type: 'varchar', length: 100 })
  dimension: string; // accuracy, completeness, consistency, timeliness, validity

  @Column({ type: 'float', default: 0 })
  score: number; // 0-100

  @Column({ type: 'text', nullable: true })
  findings: string; // Issues found

  @Column({ type: 'text', nullable: true })
  remediation: string; // Plan to address issues

  @Column({ type: 'timestamp', nullable: true })
  nextReviewDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reviewer: string; // Person who evaluated quality

  @CreateDateColumn()
  createdAt: Date;
}
