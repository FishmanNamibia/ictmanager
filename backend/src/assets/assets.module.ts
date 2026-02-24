import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Asset } from './asset.entity';
import { SoftwareLicense } from './software-license.entity';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { AssetsImportController } from './assets-import.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asset, SoftwareLicense]),
    MulterModule.register({}),
  ],
  providers: [AssetsService],
  controllers: [AssetsImportController, AssetsController],
  exports: [AssetsService],
})
export class AssetsModule {}
