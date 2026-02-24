import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';

export enum DataClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted',
  PII = 'pii',
}

export enum DataAssetType {
  DATABASE = 'database',
  FILE_SYSTEM = 'file_system',
  API = 'api',
  DATA_WAREHOUSE = 'data_warehouse',
  CLOUD_STORAGE = 'cloud_storage',
}

@Entity('data_assets')
export class DataAsset {
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

  @Column({ type: 'enum', enum: DataAssetType })
  assetType: DataAssetType;

  @Column({ type: 'enum', enum: DataClassification })
  classification: DataClassification;

  @Column({ type: 'varchar', length: 255, nullable: true })
  owner: string; // Email of data owner

  @Column({ type: 'varchar', length: 255, nullable: true })
  steward: string; // Data steward responsible for quality

  @Column({ type: 'integer', default: 0 })
  recordCount: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  location: string; // Physical or logical location

  @Column({ type: 'text', nullable: true })
  dataElements: string; // List of columns/fields

  @Column({ type: 'timestamp', nullable: true })
  lastAccessDate: Date;

  @Column({ type: 'integer', default: 0 })
  accessCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
