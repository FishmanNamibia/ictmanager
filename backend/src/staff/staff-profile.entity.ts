import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('staff_profiles')
@Index(['tenantId'])
@Index(['tenantId', 'userId'], { unique: true })
export class StaffProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'job_title', type: 'varchar', nullable: true })
  jobTitle: string | null;

  @Column({ type: 'varchar', nullable: true })
  department: string | null;

  @Column({ name: 'reports_to_user_id', type: 'varchar', nullable: true })
  reportsToUserId: string | null;

  @Column({ name: 'capacity_percent', type: 'int', nullable: true })
  capacityPercent: number | null; // 0-100 workload allocation

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
