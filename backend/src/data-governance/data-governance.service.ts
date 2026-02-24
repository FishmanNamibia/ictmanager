import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataAsset, DataClassification, DataProcessingRecord, DataQualityMetric } from './entities';

@Injectable()
export class DataGovernanceService {
  constructor(
    @InjectRepository(DataAsset)
    private readonly assetRepo: Repository<DataAsset>,
    @InjectRepository(DataProcessingRecord)
    private readonly processingRecordRepo: Repository<DataProcessingRecord>,
    @InjectRepository(DataQualityMetric)
    private readonly qualityMetricRepo: Repository<DataQualityMetric>,
  ) {}

  // Data Assets
  async createAsset(tenantId: string, data: Partial<DataAsset>): Promise<DataAsset> {
    const asset = this.assetRepo.create({ ...data, tenantId });
    return this.assetRepo.save(asset);
  }

  async findAssets(tenantId: string, classification?: DataClassification): Promise<DataAsset[]> {
    const where: any = { tenantId };
    if (classification) where.classification = classification;
    return this.assetRepo.find({ where, order: { name: 'ASC' } });
  }

  async findAsset(tenantId: string, id: string): Promise<DataAsset> {
    const asset = await this.assetRepo.findOne({ where: { id, tenantId } });
    if (!asset) throw new NotFoundException('Data asset not found');
    return asset;
  }

  async updateAsset(tenantId: string, id: string, data: Partial<DataAsset>): Promise<DataAsset> {
    await this.findAsset(tenantId, id);
    await this.assetRepo.update({ id, tenantId }, data as any);
    return this.findAsset(tenantId, id);
  }

  async deleteAsset(tenantId: string, id: string): Promise<void> {
    await this.findAsset(tenantId, id);
    await this.assetRepo.delete({ id, tenantId });
  }

  // Data Processing Records
  async createProcessingRecord(tenantId: string, data: Partial<DataProcessingRecord>): Promise<DataProcessingRecord> {
    const record = this.processingRecordRepo.create({ ...data, tenantId });
    return this.processingRecordRepo.save(record);
  }

  async findProcessingRecords(tenantId: string): Promise<DataProcessingRecord[]> {
    return this.processingRecordRepo.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }

  async findProcessingRecord(tenantId: string, id: string): Promise<DataProcessingRecord> {
    const record = await this.processingRecordRepo.findOne({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Processing record not found');
    return record;
  }

  async updateProcessingRecord(tenantId: string, id: string, data: Partial<DataProcessingRecord>): Promise<DataProcessingRecord> {
    await this.findProcessingRecord(tenantId, id);
    await this.processingRecordRepo.update({ id, tenantId }, data as any);
    return this.findProcessingRecord(tenantId, id);
  }

  async deleteProcessingRecord(tenantId: string, id: string): Promise<void> {
    await this.findProcessingRecord(tenantId, id);
    await this.processingRecordRepo.delete({ id, tenantId });
  }

  // Data Quality Metrics
  async createQualityMetric(tenantId: string, data: Partial<DataQualityMetric>): Promise<DataQualityMetric> {
    const metric = this.qualityMetricRepo.create({ ...data, tenantId });
    return this.qualityMetricRepo.save(metric);
  }

  async findQualityMetrics(tenantId: string, assetName?: string): Promise<DataQualityMetric[]> {
    const where: any = { tenantId };
    if (assetName) where.dataAssetName = assetName;
    return this.qualityMetricRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findQualityMetric(tenantId: string, id: string): Promise<DataQualityMetric> {
    const metric = await this.qualityMetricRepo.findOne({ where: { id, tenantId } });
    if (!metric) throw new NotFoundException('Quality metric not found');
    return metric;
  }

  async updateQualityMetric(tenantId: string, id: string, data: Partial<DataQualityMetric>): Promise<DataQualityMetric> {
    await this.findQualityMetric(tenantId, id);
    await this.qualityMetricRepo.update({ id, tenantId }, data as any);
    return this.findQualityMetric(tenantId, id);
  }

  async deleteQualityMetric(tenantId: string, id: string): Promise<void> {
    await this.findQualityMetric(tenantId, id);
    await this.qualityMetricRepo.delete({ id, tenantId });
  }

  // Dashboard stats
  async getGovernanceStats(tenantId: string): Promise<{
    totalAssets: number;
    assetsByClassification: Record<string, number>;
    processingRecords: number;
    pendingDPIA: number;
    qualityMetrics: number;
    lowQualityAssets: number;
  }> {
    const assets = await this.findAssets(tenantId);
    const records = await this.findProcessingRecords(tenantId);
    const metrics = await this.findQualityMetrics(tenantId);

    const byClass = assets.reduce((acc, a) => {
      acc[a.classification] = (acc[a.classification] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAssets: assets.length,
      assetsByClassification: byClass,
      processingRecords: records.length,
      pendingDPIA: records.filter((r) => !r.dpia).length,
      qualityMetrics: metrics.length,
      lowQualityAssets: metrics.filter((m) => m.score < 70).length,
    };
  }
}
