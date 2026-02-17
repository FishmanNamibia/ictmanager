import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('software_licenses')
@Index(['tenantId'])
@Index(['tenantId', 'softwareName'])
export class SoftwareLicense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'software_name' })
  softwareName: string;

  @Column({ name: 'license_key', type: 'varchar', nullable: true })
  licenseKey: string | null;

  @Column({ name: 'license_type', default: 'perpetual' }) // perpetual, subscription, concurrent
  licenseType: string;

  @Column({ name: 'total_seats', type: 'int', default: 1 })
  totalSeats: number;

  @Column({ name: 'used_seats', type: 'int', default: 0 })
  usedSeats: number;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date | null;

  @Column({ name: 'vendor_name', type: 'varchar', nullable: true })
  vendorName: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  cost: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
