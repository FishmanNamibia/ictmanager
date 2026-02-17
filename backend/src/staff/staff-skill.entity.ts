import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

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

  @Column()
  skillName: string;

  @Column({ type: 'varchar', length: 20, default: 'intermediate' }) // beginner, intermediate, advanced, expert
  level: string;

  @Column({ name: 'certification_name', type: 'varchar', nullable: true })
  certificationName: string | null;

  @Column({ name: 'certification_expiry', type: 'date', nullable: true })
  certificationExpiry: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
