import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';
import { Vendor } from './vendor.entity';

@Entity('vendor_contracts')
export class VendorContract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  vendorId: string;

  @ManyToOne(() => Vendor, (vendor) => vendor.contracts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendorId' })
  vendor: Vendor;

  @Column({ type: 'varchar', length: 80, nullable: true })
  contractNumber: string | null;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contractType: string | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date | null;

  @Column({ type: 'int', default: 90 })
  renewalNoticeDays: number;

  @Column({ type: 'boolean', default: false })
  autoRenew: boolean;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  annualValue: number | null;

  @Column({ type: 'varchar', length: 5, default: 'NAD' })
  currency: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  slaTarget: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  slaMetPercent: number | null;

  @Column({ type: 'text', nullable: true })
  penaltyClause: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  owner: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  documentUrl: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

