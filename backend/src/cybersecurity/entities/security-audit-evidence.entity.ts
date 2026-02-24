import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';

export enum AuditType {
  MFA_VERIFICATION = 'mfa_verification',
  RBAC_CHANGE = 'rbac_change',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  ACCESS_GRANT = 'access_grant',
  ACCESS_REVOKE = 'access_revoke',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  CONFIG_CHANGE = 'config_change',
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access',
}

@Entity('security_audit_evidence')
export class SecurityAuditEvidence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ type: 'enum', enum: AuditType })
  auditType: AuditType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userId: string; // User email or ID

  @Column({ type: 'varchar', length: 255, nullable: true })
  actionBy: string; // Admin or system that performed action

  @Column({ type: 'varchar', length: 500, nullable: true })
  resource: string; // Resource being accessed/modified

  @Column({ type: 'text', nullable: true })
  details: string; // JSON or text details of the action

  @Column({ type: 'varchar', length: 100, nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string;

  @Column({ type: 'boolean', default: true })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}
