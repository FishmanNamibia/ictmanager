import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { AssetsService } from './assets.service';

@Injectable()
export class AssetsMonitoringService {
  private readonly logger = new Logger(AssetsMonitoringService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    private readonly assetsService: AssetsService,
  ) {}

  @Cron('0 3 * * *')
  async runDailyAlertSweep() {
    const tenants = await this.tenantRepo.find({ where: { active: true } });
    for (const tenant of tenants) {
      try {
        await this.assetsService.runAlertsForTenant(tenant.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Asset alert sweep failed for tenant ${tenant.slug}: ${message}`);
      }
    }
  }
}
