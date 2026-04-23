import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OwnerGuard } from './owner.guard';
import { OwnerService } from './owner.service';

@Controller('owner')
@UseGuards(JwtAuthGuard, OwnerGuard)
export class OwnerController {
  constructor(private readonly ownerService: OwnerService) {}

  @Get('stats')
  getStats() {
    return this.ownerService.getStats();
  }

  @Get('tenants')
  listTenants() {
    return this.ownerService.listAllTenants();
  }

  @Get('tenants/:id')
  getTenant(@Param('id') id: string) {
    return this.ownerService.getTenant(id);
  }

  @Post('tenants')
  @HttpCode(HttpStatus.CREATED)
  createTenant(
    @Body()
    body: {
      name: string;
      billingEmail: string;
      contactName?: string;
      plan: string;
      maxUsers?: number;
      notes?: string;
      adminEmail: string;
      adminPassword: string;
      adminFullName: string;
    },
  ) {
    return this.ownerService.createTenant(body);
  }

  @Patch('tenants/:id')
  updateTenant(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      plan: string;
      subscriptionStatus: string;
      subscriptionExpiresAt: string | null;
      maxUsers: number | null;
      billingEmail: string;
      contactName: string;
      notes: string;
      active: boolean;
    }>,
  ) {
    return this.ownerService.updateTenant(id, body);
  }
}
