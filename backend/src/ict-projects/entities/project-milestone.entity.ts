import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { IctProject } from './ict-project.entity';

export enum MilestoneStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  AT_RISK = 'at_risk',
  DELAYED = 'delayed',
}

@Entity('project_milestones')
export class ProjectMilestone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @ManyToOne(() => IctProject, (project) => project.milestones, { onDelete: 'CASCADE' })
  project: IctProject;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: MilestoneStatus, default: MilestoneStatus.PLANNED })
  status: MilestoneStatus;

  @Column({ type: 'timestamp' })
  targetDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  completionDate: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  deliverable: string; // What is delivered

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}
