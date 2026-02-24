import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataGovernanceService } from './data-governance.service';
import { DataGovernanceController } from './data-governance.controller';
import { DataAsset, DataProcessingRecord, DataQualityMetric } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([DataAsset, DataProcessingRecord, DataQualityMetric])],
  providers: [DataGovernanceService],
  controllers: [DataGovernanceController],
  exports: [DataGovernanceService],
})
export class DataGovernanceModule {}
