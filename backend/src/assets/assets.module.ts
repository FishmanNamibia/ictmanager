import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from './asset.entity';
import { SoftwareLicense } from './software-license.entity';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { LicensesController } from './licenses.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asset, SoftwareLicense]),
  ],
  providers: [AssetsService],
  controllers: [AssetsController, LicensesController],
  exports: [AssetsService],
})
export class AssetsModule {}
