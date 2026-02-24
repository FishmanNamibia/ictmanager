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

@Entity('policy_ack_scopes')
@Index(['tenantId'])
@Index(['tenantId', 'policyId'])
export class PolicyAcknowledgementScope {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'policy_id' })
  policyId: string;

  @ManyToOne(() => Policy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policy_id' })
  policy: Policy;

  @Column({ type: 'varchar', length: 50, nullable: true })
  role: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  department: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
