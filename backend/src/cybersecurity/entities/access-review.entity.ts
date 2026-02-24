import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';

export enum AccessReviewStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
}

@Entity('access_reviews')
export class AccessReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  scope: string; // e.g., all_users, admins, department_x, application_y

  @Column({ type: 'enum', enum: AccessReviewStatus, default: AccessReviewStatus.SCHEDULED })
  status: AccessReviewStatus;

  @Column({ type: 'timestamp' })
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastCompletedDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextDueDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reviewer: string; // Email of person responsible for review

  @Column({ type: 'integer', default: 0 })
  usersReviewedCount: number;

  @Column({ type: 'integer', default: 0 })
  accessRemovedCount: number;

  @Column({ type: 'text', nullable: true })
  findings: string; // Summary of findings and actions taken

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
