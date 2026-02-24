import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { ServiceTicket } from './service-ticket.entity';

@Entity('ticket_comments')
export class TicketComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ticketId: string;

  @ManyToOne(() => ServiceTicket, (ticket) => ticket.comments, { onDelete: 'CASCADE' })
  ticket: ServiceTicket;

  @Column({ type: 'varchar', length: 255 })
  commentBy: string; // Email of commenter

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'boolean', default: false })
  isInternal: boolean; // Internal note not visible to user

  @CreateDateColumn()
  createdAt: Date;
}
