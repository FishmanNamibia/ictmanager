import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';
import { ChangeRequest } from './change-request.entity';

@Entity('release_records')
export class ReleaseRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 50 })
  releaseNumber: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  version: string | null;

  @Column({ type: 'varchar', length: 80, default: 'production' })
  environment: string;

  @Column({ type: 'varchar', length: 30, default: 'planned' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  plannedDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  releaseDate: Date | null;

  @Column({ type: 'uuid', nullable: true })
  changeRequestId: string | null;

  @ManyToOne(() => ChangeRequest, (change) => change.releases, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'changeRequestId' })
  changeRequest: ChangeRequest | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  releaseManager: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'text', nullable: true })
  postReleaseSummary: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

