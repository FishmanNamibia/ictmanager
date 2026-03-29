import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantId } from '../tenant/decorators/tenant-id.decorator';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetStatus, AssetType } from './asset.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/roles';
import { CreateAssetMovementDto } from './dto/create-asset-movement.dto';
import { ApproveAssetMovementDto } from './dto/approve-asset-movement.dto';
import { CreateAssetVerificationDto } from './dto/create-asset-verification.dto';
import { ResolveAssetVerificationDto } from './dto/resolve-asset-verification.dto';
import { CreateAssetDocumentDto } from './dto/create-asset-document.dto';
import { ModuleAccess } from '../tenant/decorators/module-access.decorator';
import { ModuleAccessGuard } from '../tenant/guards/module-access.guard';

const ASSET_READ_ROLES = [
  Role.ICT_MANAGER,
  Role.ICT_STAFF,
  Role.AUDITOR,
  Role.EXECUTIVE,
  Role.BUSINESS_MANAGER,
] as const;

@Controller('assets')
@ModuleAccess('assets')
@UseGuards(JwtAuthGuard, RolesGuard, ModuleAccessGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @Roles(Role.ICT_MANAGER, Role.ICT_STAFF)
  create(
    @TenantId() tenantId: string,
    @Body() dto: CreateAssetDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    return this.assetsService.create(tenantId, dto, this.assetsService.buildRequestActor(user, req.ip));
  }

  @Get()
  @Roles(...ASSET_READ_ROLES)
  findAll(
    @TenantId() tenantId: string,
    @Query('status') status?: AssetStatus,
    @Query('type') type?: AssetType,
  ) {
    return this.assetsService.findAll(tenantId, { status, type });
  }

  @Get('control-overview')
  @Roles(...ASSET_READ_ROLES)
  getControlOverview(@TenantId() tenantId: string) {
    return this.assetsService.getControlOverview(tenantId);
  }

  @Get('reports/summary')
  @Roles(...ASSET_READ_ROLES)
  getReports(@TenantId() tenantId: string) {
    return this.assetsService.getInventoryReports(tenantId);
  }

  @Get('reports/export')
  @Roles(...ASSET_READ_ROLES)
  async exportReport(
    @TenantId() tenantId: string,
    @Query('type') type: string,
    @Res() res: Response,
  ) {
    const report = await this.assetsService.exportInventoryReportCsv(tenantId, type);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
    res.send(report.buffer);
  }

  @Post('alerts/run')
  @Roles(Role.ICT_MANAGER)
  runAlerts(@TenantId() tenantId: string) {
    return this.assetsService.runAlertsForTenant(tenantId);
  }

  @Get('import-template')
  @Roles(...ASSET_READ_ROLES)
  getImportTemplate(@Res() res: Response) {
    const buffer = this.assetsService.getImportTemplateBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=assets-import-template.xlsx');
    res.send(buffer);
  }

  @Get(':id/history')
  @Roles(...ASSET_READ_ROLES)
  getHistory(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.assetsService.getHistory(tenantId, id);
  }

  @Get(':id/movements')
  @Roles(...ASSET_READ_ROLES)
  listMovements(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.assetsService.listMovements(tenantId, id);
  }

  @Post(':id/movements')
  @Roles(Role.ICT_MANAGER, Role.ICT_STAFF)
  createMovement(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: CreateAssetMovementDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    return this.assetsService.createMovement(tenantId, id, dto, this.assetsService.buildRequestActor(user, req.ip));
  }

  @Post(':id/movements/:movementId/approval')
  @Roles(Role.ICT_MANAGER)
  approveMovement(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('movementId') movementId: string,
    @Body() dto: ApproveAssetMovementDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    return this.assetsService.approveMovement(tenantId, id, movementId, dto, this.assetsService.buildRequestActor(user, req.ip));
  }

  @Get(':id/verifications')
  @Roles(...ASSET_READ_ROLES)
  listVerifications(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.assetsService.listVerifications(tenantId, id);
  }

  @Post(':id/verifications')
  @Roles(Role.ICT_MANAGER, Role.ICT_STAFF, Role.AUDITOR)
  createVerification(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: CreateAssetVerificationDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    return this.assetsService.createVerification(tenantId, id, dto, this.assetsService.buildRequestActor(user, req.ip));
  }

  @Post(':id/verifications/:verificationId/resolve')
  @Roles(Role.ICT_MANAGER, Role.ICT_STAFF)
  resolveVerification(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('verificationId') verificationId: string,
    @Body() dto: ResolveAssetVerificationDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    return this.assetsService.resolveVerification(tenantId, id, verificationId, dto, this.assetsService.buildRequestActor(user, req.ip));
  }

  @Get(':id/documents')
  @Roles(...ASSET_READ_ROLES)
  listDocuments(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.assetsService.listDocuments(tenantId, id);
  }

  @Post(':id/documents')
  @Roles(Role.ICT_MANAGER, Role.ICT_STAFF)
  @UseInterceptors(FileInterceptor('file'))
  createDocument(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: CreateAssetDocumentDto,
    @UploadedFile() file: { buffer: Buffer; originalname?: string; mimetype?: string; size?: number },
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    return this.assetsService.createDocument(tenantId, id, dto, file, this.assetsService.buildRequestActor(user, req.ip));
  }

  @Get(':id/documents/:documentId/download')
  @Roles(...ASSET_READ_ROLES)
  async downloadDocument(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Res() res: Response,
  ) {
    const document = await this.assetsService.getDocumentContent(tenantId, id, documentId);
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.send(document.content);
  }

  @Get(':id')
  @Roles(...ASSET_READ_ROLES)
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.assetsService.findOne(tenantId, id);
  }

  @Put(':id')
  @Roles(Role.ICT_MANAGER, Role.ICT_STAFF)
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    return this.assetsService.update(tenantId, id, dto, this.assetsService.buildRequestActor(user, req.ip));
  }

  @Delete(':id')
  @Roles(Role.ICT_MANAGER)
  remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    return this.assetsService.remove(tenantId, id, this.assetsService.buildRequestActor(user, req.ip));
  }
}
