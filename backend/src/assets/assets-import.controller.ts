import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../tenant/decorators/tenant-id.decorator';

/** Dedicated controller for asset import so the route is registered reliably (POST /api/assets/import-excel). */
@Controller('assets')
@UseGuards(JwtAuthGuard)
export class AssetsImportController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('import-excel')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(
    @TenantId() tenantId: string,
    @UploadedFile() file?: { buffer: Buffer; originalname?: string },
  ) {
    if (!file?.buffer) throw new BadRequestException('No file uploaded. Use form field "file".');
    const ext = (file.originalname || '').toLowerCase();
    const allowed = ['.xlsx', '.xls', '.csv'];
    if (!allowed.some((e) => ext.endsWith(e))) {
      throw new BadRequestException('File must be Excel (.xlsx, .xls) or CSV. For Snipe-IT / inventory exports, use CSV or save as .xlsx in Excel.');
    }
    return this.assetsService.importFromExcel(tenantId, file.buffer, file.originalname);
  }
}
