import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

@Entity('staff_certifications')
@Index(['tenantId'])
@Index(['tenantId', 'staffProfileId'])
export class StaffCertification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'staff_profile_id' })
  staffProfileId: string;

  @Column({ name: 'cert_name' })
  certName: string;

  @Column({ type: 'varchar', nullable: true })
  provider: string | null;

  @Column({ name: 'cert_level', type: 'varchar', nullable: true })
  certLevel: string | null;

  @Column({ name: 'attained_date', type: 'date', nullable: true })
  attainedDate: Date | null;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date | null;

  @Column({ type: 'boolean', default: false })
  mandatory: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
