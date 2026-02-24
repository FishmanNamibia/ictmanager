import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ServiceDeskService } from './service-desk.service';
import { ServiceTicket, TicketStatus, TicketComment } from './entities';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../tenant/decorators/tenant-id.decorator';
import { Role } from '../common/roles';

@Controller('service-desk')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiceDeskController {
  constructor(private readonly service: ServiceDeskService) {}

  // Tickets
  @Get('tickets')
  async getTickets(
    @TenantId() tenantId: string,
    @Query('status') status?: TicketStatus,
    @Query('assignedTo') assignedTo?: string,
  ): Promise<ServiceTicket[]> {
    return this.service.findTickets(tenantId, status, assignedTo);
  }

  @Get('tickets/:id')
  async getTicket(@TenantId() tenantId: string, @Param('id') id: string): Promise<ServiceTicket> {
    return this.service.findTicket(tenantId, id);
  }

  @Post('tickets')
  @Roles(Role.ICT_MANAGER, Role.ICT_STAFF)
  async createTicket(@TenantId() tenantId: string, @Body() data: Partial<ServiceTicket>): Promise<ServiceTicket> {
    return this.service.createTicket(tenantId, data);
  }

  @Put('tickets/:id')
  @Roles(Role.ICT_MANAGER)
  async updateTicket(@TenantId() tenantId: string, @Param('id') id: string, @Body() data: Partial<ServiceTicket>): Promise<ServiceTicket> {
    return this.service.updateTicket(tenantId, id, data);
  }

  @Delete('tickets/:id')
  @Roles(Role.ICT_MANAGER)
  async deleteTicket(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.service.deleteTicket(tenantId, id);
  }

  // Comments
  @Get('tickets/:ticketId/comments')
  async getComments(@TenantId() tenantId: string, @Param('ticketId') ticketId: string): Promise<TicketComment[]> {
    return this.service.getComments(tenantId, ticketId);
  }

  @Post('tickets/:ticketId/comments')
  @Roles(Role.ICT_MANAGER, Role.ICT_STAFF)
  async addComment(
    @TenantId() tenantId: string,
    @Param('ticketId') ticketId: string,
    @Body() data: { commentBy: string; content: string; isInternal?: boolean },
  ): Promise<TicketComment> {
    return this.service.addComment(tenantId, ticketId, data);
  }

  // Dashboard stats
  @Get('dashboard-stats')
  async getServiceDeskStats(@TenantId() tenantId: string): Promise<any> {
    return this.service.getServiceDeskStats(tenantId);
  }
}
