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
export type AssetCondition = 'new' | 'good' | 'fair' | 'poor' | 'damaged';
export type AssetSubtype = 'ups' | 'server' | 'laptop' | 'desktop' | 'printer' | 'switch' | 'router' | 'other';

@Entity('assets')
@Index(['tenantId', 'assetTag'], { unique: true })
@Index(['tenantId', 'barcode'], { unique: true })
@Index(['tenantId', 'status'])
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'asset_tag', unique: false })
  assetTag: string;

  @Column({ type: 'varchar', nullable: true })
  barcode: string | null;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50 })
  type: AssetType;

  @Column({ name: 'asset_subtype', type: 'varchar', length: 50, nullable: true })
  assetSubtype: AssetSubtype | null;

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

  @Column({ name: 'expected_end_of_life', type: 'date', nullable: true })
  expectedEndOfLife: Date | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  cost: number | null;

  @Column({ name: 'useful_life_months', type: 'int', nullable: true })
  usefulLifeMonths: number | null;

  @Column({ name: 'assigned_to_user_id', type: 'varchar', nullable: true })
  assignedToUserId: string | null;

  @Column({ name: 'assigned_to_name', type: 'varchar', nullable: true })
  assignedToName: string | null;

  @Column({ name: 'assigned_to_department', type: 'varchar', nullable: true })
  assignedToDepartment: string | null;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  @Column({ type: 'varchar', nullable: true })
  supplier: string | null;

  @Column({ name: 'maintenance_provider', type: 'varchar', nullable: true })
  maintenanceProvider: string | null;

  @Column({ name: 'maintenance_frequency_months', type: 'int', nullable: true })
  maintenanceFrequencyMonths: number | null;

  @Column({ name: 'last_maintenance_date', type: 'date', nullable: true })
  lastMaintenanceDate: Date | null;

  @Column({ name: 'next_maintenance_date', type: 'date', nullable: true })
  nextMaintenanceDate: Date | null;

  @Column({ name: 'maintenance_contract_end', type: 'date', nullable: true })
  maintenanceContractEnd: Date | null;

  @Column({ name: 'po_number', type: 'varchar', nullable: true })
  poNumber: string | null;

  @Column({ name: 'ip_address', type: 'varchar', nullable: true })
  ipAddress: string | null;

  @Column({ name: 'battery_install_date', type: 'date', nullable: true })
  batteryInstallDate: Date | null;

  @Column({ name: 'battery_replacement_due', type: 'date', nullable: true })
  batteryReplacementDue: Date | null;

  @Column({ name: 'load_capacity_kva', type: 'decimal', precision: 10, scale: 2, nullable: true })
  loadCapacityKva: number | null;

  @Column({ name: 'runtime_minutes', type: 'int', nullable: true })
  runtimeMinutes: number | null;

  @Column({ name: 'protected_systems', type: 'text', nullable: true })
  protectedSystems: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  condition: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
