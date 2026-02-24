import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Policy } from './policy.entity';

@Entity('policy_versions')
@Index(['tenantId'])
@Index(['tenantId', 'policyId'])
export class PolicyVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'policy_id' })
  policyId: string;

  @ManyToOne(() => Policy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policy_id' })
  policy: Policy;

  @Column({ name: 'version_label', type: 'varchar', length: 50 })
  versionLabel: string;

  @Column({ name: 'document_url', type: 'varchar', nullable: true })
  documentUrl: string | null;

  @Column({ name: 'change_summary', type: 'text', nullable: true })
  changeSummary: string | null;

  @Column({ name: 'uploaded_by', type: 'varchar', length: 255, nullable: true })
  uploadedBy: string | null;

  @Column({ name: 'is_current', type: 'boolean', default: false })
  isCurrent: boolean;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;
}
