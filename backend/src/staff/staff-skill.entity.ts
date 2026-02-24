import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

export type SkillCategory =
  | 'infrastructure' | 'networking' | 'security' | 'applications'
  | 'data' | 'devops' | 'service_management' | 'soft_skills';

export type SkillPriority = 'has_it' | 'needed_now' | 'needed_later';

@Entity('staff_skills')
@Index(['tenantId'])
@Index(['tenantId', 'staffProfileId'])
export class StaffSkill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'staff_profile_id' })
  staffProfileId: string;

  @Column({ name: 'skill_name' })
  skillName: string;

  @Column({ name: 'skill_category', type: 'varchar', nullable: true })
  skillCategory: SkillCategory | null;

  /** Numeric proficiency: 0=none, 1=basic, 2=working, 3=proficient, 4=advanced, 5=expert */
  @Column({ name: 'skill_level', type: 'int', default: 2 })
  skillLevel: number;

  /** Legacy string level - kept for backwards compat */
  @Column({ type: 'varchar', length: 20, nullable: true })
  level: string | null;

  @Column({ name: 'last_used', type: 'date', nullable: true })
  lastUsed: Date | null;

  @Column({ type: 'text', nullable: true })
  evidence: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, default: 'has_it' })
  priority: SkillPriority | null;

  /** Legacy certification fields */
  @Column({ name: 'certification_name', type: 'varchar', nullable: true })
  certificationName: string | null;

  @Column({ name: 'certification_expiry', type: 'date', nullable: true })
  certificationExpiry: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
