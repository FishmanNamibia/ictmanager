import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

export type EmploymentType = 'permanent' | 'contract' | 'intern' | 'consultant';
export type RoleType = 'support' | 'dev' | 'network' | 'security' | 'data' | 'dba' | 'apps' | 'helpdesk' | 'management';
export type WorkloadStatus = 'overloaded' | 'high' | 'normal' | 'under_utilised';

@Entity('staff_profiles')
@Index(['tenantId'])
export class StaffProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  // ── Core Identity ──────────────────────────────────────────────────────
  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'employee_number', type: 'varchar', nullable: true })
  employeeNumber: string | null;

  @Column({ name: 'job_title', type: 'varchar', nullable: true })
  jobTitle: string | null;

  @Column({ type: 'varchar', nullable: true })
  grade: string | null;

  @Column({ type: 'varchar', nullable: true })
  department: string | null;

  @Column({ type: 'varchar', nullable: true })
  unit: string | null;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  @Column({ name: 'employment_type', type: 'varchar', length: 20, nullable: true })
  employmentType: EmploymentType | null;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date | null;

  @Column({ name: 'supervisor_name', type: 'varchar', nullable: true })
  supervisorName: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  // ── Legacy column kept for user account linking ───────────────────────
  @Column({ name: 'user_id', type: 'varchar', nullable: true })
  userId: string | null;

  @Column({ name: 'reports_to_user_id', type: 'varchar', nullable: true })
  reportsToUserId: string | null;

  // ── Operational Role ──────────────────────────────────────────────────
  @Column({ name: 'role_type', type: 'varchar', length: 20, nullable: true })
  roleType: RoleType | null;

  @Column({ name: 'on_call_eligible', type: 'boolean', default: false })
  onCallEligible: boolean;

  @Column({ name: 'shift_hours', type: 'varchar', nullable: true })
  shiftHours: string | null;

  // ── Workload Allocation ───────────────────────────────────────────────
  @Column({ name: 'operational_percent', type: 'int', nullable: true })
  operationalPercent: number | null;

  @Column({ name: 'projects_percent', type: 'int', nullable: true })
  projectsPercent: number | null;

  @Column({ name: 'admin_percent', type: 'int', nullable: true })
  adminPercent: number | null;

  @Column({ name: 'training_percent', type: 'int', nullable: true })
  trainingPercent: number | null;

  /** Legacy field - kept for backwards compat, computed now as sum of above */
  @Column({ name: 'capacity_percent', type: 'int', nullable: true })
  capacityPercent: number | null;

  // ── Development ───────────────────────────────────────────────────────
  @Column({ name: 'pdp_notes', type: 'text', nullable: true })
  pdpNotes: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
