import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type AssetMovementType =
  | 'stock_in'
  | 'stock_out'
  | 'transfer'
  | 'return'
  | 'adjustment'
  | 'damaged'
  | 'lost'
  | 'disposal'
  | 'maintenance';

export type AssetApprovalStatus = 'not_required' | 'pending' | 'approved' | 'rejected';

@Entity('asset_movements')
@Index(['tenantId', 'assetId', 'occurredAt'])
@Index(['tenantId', 'approvalStatus'])
export class AssetMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'asset_id' })
  assetId: string;

  @Column({ name: 'movement_type', type: 'varchar', length: 30 })
  movementType: AssetMovementType;

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt: Date;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ name: 'from_location', type: 'varchar', nullable: true })
  fromLocation: string | null;

  @Column({ name: 'to_location', type: 'varchar', nullable: true })
  toLocation: string | null;

  @Column({ name: 'from_assigned_to_user_id', type: 'varchar', nullable: true })
  fromAssignedToUserId: string | null;

  @Column({ name: 'to_assigned_to_user_id', type: 'varchar', nullable: true })
  toAssignedToUserId: string | null;

  @Column({ name: 'from_assigned_to_name', type: 'varchar', nullable: true })
  fromAssignedToName: string | null;

  @Column({ name: 'to_assigned_to_name', type: 'varchar', nullable: true })
  toAssignedToName: string | null;

  @Column({ name: 'from_department', type: 'varchar', nullable: true })
  fromDepartment: string | null;

  @Column({ name: 'to_department', type: 'varchar', nullable: true })
  toDepartment: string | null;

  @Column({ name: 'from_status', type: 'varchar', length: 30, nullable: true })
  fromStatus: string | null;

  @Column({ name: 'new_status', type: 'varchar', length: 30, nullable: true })
  newStatus: string | null;

  @Column({ name: 'from_condition', type: 'varchar', length: 30, nullable: true })
  fromCondition: string | null;

  @Column({ name: 'new_condition', type: 'varchar', length: 30, nullable: true })
  newCondition: string | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'approval_required', default: false })
  approvalRequired: boolean;

  @Column({ name: 'approval_status', type: 'varchar', length: 20, default: 'not_required' })
  approvalStatus: AssetApprovalStatus;

  @Column({ name: 'requested_by_user_id', type: 'varchar', nullable: true })
  requestedByUserId: string | null;

  @Column({ name: 'requested_by_name', type: 'varchar', nullable: true })
  requestedByName: string | null;

  @Column({ name: 'approved_by_user_id', type: 'varchar', nullable: true })
  approvedByUserId: string | null;

  @Column({ name: 'approved_by_name', type: 'varchar', nullable: true })
  approvedByName: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'approval_comment', type: 'text', nullable: true })
  approvalComment: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
