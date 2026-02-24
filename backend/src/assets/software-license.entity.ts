import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type LicenseCategory = 'os' | 'productivity' | 'security' | 'erp' | 'database' | 'development' | 'communication' | 'other';
export type LicenseTypeEnum = 'per_user' | 'per_device' | 'concurrent' | 'perpetual' | 'subscription' | 'site' | 'enterprise' | 'oem';
export type LicenseCriticality = 'high' | 'medium' | 'low';
export type LicenseCurrency = 'NAD' | 'USD' | 'ZAR' | 'EUR' | 'GBP';

@Entity('software_licenses')
@Index(['tenantId'])
@Index(['tenantId', 'softwareName'])
export class SoftwareLicense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  // ── Identity ──────────────────────────────────────────────
  @Column({ name: 'software_name' })
  softwareName: string;

  @Column({ name: 'software_category', type: 'varchar', nullable: true })
  softwareCategory: LicenseCategory | null;

  @Column({ type: 'varchar', nullable: true })
  version: string | null;

  @Column({ type: 'varchar', nullable: true })
  vendor: string | null;

  /** Legacy column kept for backwards compat */
  @Column({ name: 'vendor_name', type: 'varchar', nullable: true })
  vendorName: string | null;

  // ── License terms ─────────────────────────────────────────
  @Column({ name: 'license_type', default: 'subscription' })
  licenseType: string;

  @Column({ name: 'license_key', type: 'varchar', nullable: true })
  licenseKey: string | null;

  @Column({ name: 'contract_ref', type: 'varchar', nullable: true })
  contractRef: string | null;

  @Column({ name: 'procurement_ref', type: 'varchar', nullable: true })
  procurementRef: string | null;

  // ── Dates ─────────────────────────────────────────────────
  @Column({ name: 'purchase_date', type: 'date', nullable: true })
  purchaseDate: Date | null;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date | null;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date | null;

  @Column({ name: 'support_end_date', type: 'date', nullable: true })
  supportEndDate: Date | null;

  // ── Seat tracking ─────────────────────────────────────────
  @Column({ name: 'total_seats', type: 'int', default: 1 })
  totalSeats: number;

  @Column({ name: 'used_seats', type: 'int', default: 0 })
  usedSeats: number;

  // ── Financial ─────────────────────────────────────────────
  @Column({ name: 'cost_per_seat', type: 'decimal', precision: 12, scale: 2, nullable: true })
  costPerSeat: number | null;

  /** Legacy column kept for backwards compat */
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  cost: number | null;

  @Column({ type: 'varchar', length: 3, nullable: true, default: 'NAD' })
  currency: string | null;

  // ── Ownership ─────────────────────────────────────────────
  @Column({ name: 'business_owner', type: 'varchar', nullable: true })
  businessOwner: string | null;

  @Column({ name: 'ict_owner', type: 'varchar', nullable: true })
  ictOwner: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true, default: 'medium' })
  criticality: string | null;

  // ── Notes ─────────────────────────────────────────────────
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
