import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IctProjectsService } from './ict-projects.service';
import { IctProjectsController } from './ict-projects.controller';
import { IctProject, ProjectMilestone } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([IctProject, ProjectMilestone])],
  providers: [IctProjectsService],
  controllers: [IctProjectsController],
  exports: [IctProjectsService],
})
export class IctProjectsModule {}
