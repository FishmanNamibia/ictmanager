import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type AssetType = 'hardware' | 'software' | 'network' | 'peripheral';
export type AssetStatus = 'active' | 'in_use' | 'maintenance' | 'retired' | 'disposed';

@Entity('assets')
@Index(['tenantId', 'assetTag'], { unique: true })
@Index(['tenantId', 'status'])
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'asset_tag', unique: false })
  assetTag: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 50 })
  type: AssetType;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: AssetStatus;

  @Column({ type: 'varchar', nullable: true })
  manufacturer: string | null;

  @Column({ type: 'varchar', nullable: true })
  model: string | null;

  @Column({ type: 'varchar', nullable: true })
  serialNumber: string | null;

  @Column({ name: 'purchase_date', type: 'date', nullable: true })
  purchaseDate: Date | null;

  @Column({ name: 'warranty_end', type: 'date', nullable: true })
  warrantyEnd: Date | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  cost: number | null;

  @Column({ name: 'assigned_to_user_id', type: 'varchar', nullable: true })
  assignedToUserId: string | null;

  @Column({ name: 'assigned_to_department', type: 'varchar', nullable: true })
  assignedToDepartment: string | null;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
