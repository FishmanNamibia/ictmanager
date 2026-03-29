import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../tenant/decorators/tenant-id.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/roles';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ModuleAccess } from '../tenant/decorators/module-access.decorator';
import { ModuleAccessGuard } from '../tenant/guards/module-access.guard';

/** Dedicated controller for asset import so the route is registered reliably (POST /api/assets/import-excel). */
@Controller('assets')
@ModuleAccess('assets')
@UseGuards(JwtAuthGuard, RolesGuard, ModuleAccessGuard)
export class AssetsImportController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('import-excel')
  @Roles(Role.ICT_MANAGER, Role.ICT_STAFF)
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(
    @TenantId() tenantId: string,
    @UploadedFile() file?: { buffer: Buffer; originalname?: string },
    @CurrentUser() user?: User,
    @Req() req?: Request,
  ) {
    if (!file?.buffer) throw new BadRequestException('No file uploaded. Use form field "file".');
    const ext = (file.originalname || '').toLowerCase();
    const allowed = ['.xlsx', '.xls', '.csv'];
    if (!allowed.some((item) => ext.endsWith(item))) {
      throw new BadRequestException('File must be Excel (.xlsx, .xls) or CSV. For Snipe-IT / inventory exports, use CSV or save as .xlsx in Excel.');
    }
    return this.assetsService.importFromExcel(
      tenantId,
      file.buffer,
      file.originalname,
      this.assetsService.buildRequestActor(user, req?.ip),
    );
  }
}
