import {
  Body, Controller, Get, Param, Post, Put, UseGuards,
  UploadedFile, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../common/roles';
import { UpdateTenantSettingsDto } from './dto/update-tenant-settings.dto';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'logos');
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('branding/default')
  getDefaultBranding() {
    return this.tenantService.getDefaultPublicBranding();
  }

  @Get('branding/by-slug/:slug')
  getBrandingBySlug(@Param('slug') slug: string) {
    return this.tenantService.getPublicBrandingBySlug(slug);
  }

  @Get('by-slug/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.tenantService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get('settings/current')
  getCurrentSettings(@CurrentUser() user: { tenantId: string }) {
    return this.tenantService.getExperienceSettings(user.tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER)
  @Put('settings/current')
  updateCurrentSettings(
    @CurrentUser() user: { tenantId: string },
    @Body() dto: UpdateTenantSettingsDto,
  ) {
    return this.tenantService.updateExperienceSettings(user.tenantId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER)
  @Post('logo')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
          cb(null, unique + extname(file.originalname));
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (/^image\/(png|jpe?g|gif|svg\+xml|webp)$/.test(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only image files are allowed'), false);
        }
      },
    }),
  )
  async uploadLogo(
    @CurrentUser() user: { tenantId: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const logoUrl = `/uploads/logos/${file.filename}`;
    await this.tenantService.updateLogoUrl(user.tenantId, logoUrl);
    return { logoUrl };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.tenantService.findById(id);
  }
}
