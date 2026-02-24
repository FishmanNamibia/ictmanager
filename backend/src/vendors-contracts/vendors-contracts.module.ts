import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vendor, VendorContract } from './entities';
import { VendorsContractsController } from './vendors-contracts.controller';
import { VendorsContractsService } from './vendors-contracts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Vendor, VendorContract])],
  controllers: [VendorsContractsController],
  providers: [VendorsContractsService],
  exports: [VendorsContractsService],
})
export class VendorsContractsModule {}

