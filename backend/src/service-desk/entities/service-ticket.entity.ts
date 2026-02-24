import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';
import { TicketComment } from './ticket-comment.entity';

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_USER = 'waiting_user',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum RequestType {
  INCIDENT = 'incident',
  SERVICE_REQUEST = 'service_request',
  CHANGE_REQUEST = 'change_request',
}

@Entity('service_tickets')
export class ServiceTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 50 })
  ticketNumber: string; // Auto-generated like INC-001, REQ-002

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: RequestType, default: RequestType.SERVICE_REQUEST })
  requestType: RequestType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string; // IT Support, Hardware, Software, Access, etc.

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Column({ type: 'enum', enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority: TicketPriority;

  @Column({ type: 'varchar', length: 255 })
  reportedBy: string; // Email of requester

  @Column({ type: 'varchar', length: 255, nullable: true })
  assignedTo: string; // Email of assignee

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedDate: Date;

  @Column({ type: 'text', nullable: true })
  resolution: string;

  @Column({ type: 'int', default: 0 })
  commentCount: number;

  @OneToMany(() => TicketComment, (comment) => comment.ticket, { cascade: true })
  comments: TicketComment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
