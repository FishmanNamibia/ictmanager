import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { DashboardsService } from './dashboards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../tenant/decorators/tenant-id.decorator';
import { Response } from 'express';
import { ModuleAccess } from '../tenant/decorators/module-access.decorator';
import { ModuleAccessGuard } from '../tenant/guards/module-access.guard';

@Controller('dashboards')
@UseGuards(JwtAuthGuard, ModuleAccessGuard)
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  /** Any authenticated user can access the ICT Manager dashboard (My Desk). */
  @Get('ict-manager')
  @ModuleAccess('dashboard')
  getIctManager(@TenantId() tenantId: string) {
    return this.dashboardsService.getIctManagerDashboard(tenantId);
  }

  /** Any authenticated user can access the executive dashboard. */
  @Get('executive')
  @ModuleAccess('executive')
  getExecutive(@TenantId() tenantId: string) {
    return this.dashboardsService.getExecutiveDashboard(tenantId);
  }

  @Get('executive/report')
  @ModuleAccess('executive')
  getExecutiveReport(@TenantId() tenantId: string) {
    return this.dashboardsService.getExecutiveReport(tenantId);
  }

  @Get('executive/report.pdf')
  @ModuleAccess('executive')
  async getExecutiveReportPdf(@TenantId() tenantId: string, @Res() res: Response) {
    try {
      const pdf = await this.dashboardsService.generateExecutiveReportPdf(tenantId);
      const fileName = `executive-board-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(pdf);
    } catch (err: any) {
      console.error('[PDF Generation Error]', err?.message ?? err);
      console.error(err?.stack);
      res.status(500).json({ error: 'PDF generation failed', detail: err?.message ?? String(err) });
    }
  }
}
