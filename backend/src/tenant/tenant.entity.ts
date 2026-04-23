import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  logoUrl: string | null;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'varchar', length: 50, default: 'trial' })
  plan: string;

  @Column({ type: 'varchar', length: 50, default: 'trial', name: 'subscription_status' })
  subscriptionStatus: string;

  @Column({ type: 'timestamp', nullable: true, name: 'subscription_expires_at' })
  subscriptionExpiresAt: Date | null;

  @Column({ type: 'int', nullable: true, name: 'max_users' })
  maxUsers: number | null;

  @Column({ type: 'varchar', nullable: true, name: 'billing_email' })
  billingEmail: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'contact_name' })
  contactName: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_system_tenant' })
  isSystemTenant: boolean;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => User, (u) => u.tenant)
  users: User[];
}
