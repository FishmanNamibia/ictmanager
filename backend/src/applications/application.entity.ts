import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type HostingType = 'on_prem' | 'cloud' | 'vendor' | 'hybrid';
export type Criticality = 'critical' | 'high' | 'medium' | 'low';

@Entity('applications')
@Index(['tenantId'])
@Index(['tenantId', 'healthStatus'])
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ name: 'business_owner', type: 'varchar', nullable: true })
  businessOwner: string | null;

  @Column({ name: 'ict_owner', type: 'varchar', nullable: true })
  ictOwner: string | null;

  @Column({ name: 'hosting_type', type: 'varchar', length: 20, default: 'on_prem' })
  hostingType: HostingType;

  @Column({ type: 'varchar', length: 20, default: 'medium' })
  criticality: Criticality;

  @Column({ name: 'health_status', default: 'operational' }) // operational, degraded, outage, unknown
  healthStatus: string;

  @Column({ name: 'vendor_name', type: 'varchar', nullable: true })
  vendorName: string | null;

  @Column({ type: 'text', nullable: true })
  dependencies: string | null; // JSON or comma-separated system IDs

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
