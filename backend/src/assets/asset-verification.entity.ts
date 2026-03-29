import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type AssetVerificationType = 'spot_check' | 'stock_take' | 'handover';

@Entity('asset_verifications')
@Index(['tenantId', 'assetId', 'checkedAt'])
@Index(['tenantId', 'varianceDetected', 'resolved'])
export class AssetVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'asset_id' })
  assetId: string;

  @Column({ name: 'verification_type', type: 'varchar', length: 20, default: 'spot_check' })
  verificationType: AssetVerificationType;

  @Column({ name: 'checked_at', type: 'timestamptz' })
  checkedAt: Date;

  @Column({ name: 'checked_by_user_id', type: 'varchar', nullable: true })
  checkedByUserId: string | null;

  @Column({ name: 'checked_by_name', type: 'varchar', nullable: true })
  checkedByName: string | null;

  @Column({ name: 'system_location', type: 'varchar', nullable: true })
  systemLocation: string | null;

  @Column({ name: 'actual_location', type: 'varchar', nullable: true })
  actualLocation: string | null;

  @Column({ name: 'system_assigned_to_name', type: 'varchar', nullable: true })
  systemAssignedToName: string | null;

  @Column({ name: 'actual_assigned_to_name', type: 'varchar', nullable: true })
  actualAssignedToName: string | null;

  @Column({ name: 'system_department', type: 'varchar', nullable: true })
  systemDepartment: string | null;

  @Column({ name: 'actual_department', type: 'varchar', nullable: true })
  actualDepartment: string | null;

  @Column({ name: 'system_status', type: 'varchar', length: 30, nullable: true })
  systemStatus: string | null;

  @Column({ name: 'actual_status', type: 'varchar', length: 30, nullable: true })
  actualStatus: string | null;

  @Column({ name: 'system_condition', type: 'varchar', length: 30, nullable: true })
  systemCondition: string | null;

  @Column({ name: 'actual_condition', type: 'varchar', length: 30, nullable: true })
  actualCondition: string | null;

  @Column({ name: 'variance_detected', default: false })
  varianceDetected: boolean;

  @Column({ name: 'variance_summary', type: 'text', nullable: true })
  varianceSummary: string | null;

  @Column({ default: false })
  resolved: boolean;

  @Column({ name: 'resolution_note', type: 'text', nullable: true })
  resolutionNote: string | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @Column({ name: 'resolved_by_user_id', type: 'varchar', nullable: true })
  resolvedByUserId: string | null;

  @Column({ name: 'resolved_by_name', type: 'varchar', nullable: true })
  resolvedByName: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
