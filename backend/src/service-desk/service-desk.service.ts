import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceTicket, TicketStatus, TicketPriority, TicketComment } from './entities';

@Injectable()
export class ServiceDeskService {
  constructor(
    @InjectRepository(ServiceTicket)
    private readonly ticketRepo: Repository<ServiceTicket>,
    @InjectRepository(TicketComment)
    private readonly commentRepo: Repository<TicketComment>,
  ) {}

  // Tickets
  async createTicket(tenantId: string, data: Partial<ServiceTicket>): Promise<ServiceTicket> {
    // Auto-generate ticket number
    const lastTicket = await this.ticketRepo.findOne({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    const nextNum = lastTicket ? parseInt(lastTicket.ticketNumber.split('-')[1]) + 1 : 1;
    const ticketNumber = `TKT-${String(nextNum).padStart(5, '0')}`;

    const ticket = this.ticketRepo.create({ ...data, tenantId, ticketNumber });
    return this.ticketRepo.save(ticket);
  }

  async findTickets(tenantId: string, status?: TicketStatus, assignedTo?: string): Promise<ServiceTicket[]> {
    const where: any = { tenantId };
    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo;
    return this.ticketRepo.find({ where, relations: ['comments'], order: { createdAt: 'DESC' } });
  }

  async findTicket(tenantId: string, id: string): Promise<ServiceTicket> {
    const ticket = await this.ticketRepo.findOne({ where: { id, tenantId }, relations: ['comments'] });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async updateTicket(tenantId: string, id: string, data: Partial<ServiceTicket>): Promise<ServiceTicket> {
    await this.findTicket(tenantId, id);
    await this.ticketRepo.update({ id, tenantId }, data as any);
    return this.findTicket(tenantId, id);
  }

  async deleteTicket(tenantId: string, id: string): Promise<void> {
    await this.findTicket(tenantId, id);
    await this.ticketRepo.delete({ id, tenantId });
  }

  // Comments
  async addComment(tenantId: string, ticketId: string, commentData: { commentBy: string; content: string; isInternal?: boolean }): Promise<TicketComment> {
    const ticket = await this.findTicket(tenantId, ticketId);
    const comment = this.commentRepo.create({ ticketId, ...commentData, isInternal: commentData.isInternal ?? false });
    await this.commentRepo.save(comment);
    await this.ticketRepo.update({ id: ticketId }, { commentCount: (ticket.commentCount || 0) + 1 });
    return comment;
  }

  async getComments(tenantId: string, ticketId: string): Promise<TicketComment[]> {
    await this.findTicket(tenantId, ticketId); // verify ticket exists
    return this.commentRepo.find({ where: { ticketId }, order: { createdAt: 'ASC' } });
  }

  // Dashboard stats
  async getServiceDeskStats(tenantId: string): Promise<{
    totalTickets: number;
    openTickets: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    averageResolutionTime: number;
    overdueTickets: number;
  }> {
    const tickets = await this.ticketRepo.find({ where: { tenantId } });

    const byStatus = tickets.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = tickets.reduce((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let totalResTime = 0;
    let resolvedCount = 0;
    const overdue = tickets.filter((t) => t.dueDate && t.dueDate < new Date() && ![TicketStatus.RESOLVED, TicketStatus.CLOSED].includes(t.status)).length;

    tickets.forEach((t) => {
      if (t.resolvedDate) {
        totalResTime += t.resolvedDate.getTime() - t.createdAt.getTime();
        resolvedCount++;
      }
    });

    const avgResTime = resolvedCount > 0 ? totalResTime / resolvedCount / (1000 * 60 * 60) : 0; // in hours

    return {
      totalTickets: tickets.length,
      openTickets: tickets.filter((t) => [TicketStatus.OPEN, TicketStatus.IN_PROGRESS].includes(t.status)).length,
      byStatus,
      byPriority,
      averageResolutionTime: Math.round(avgResTime),
      overdueTickets: overdue,
    };
  }
}
