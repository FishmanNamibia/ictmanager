import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffProfile } from './staff-profile.entity';
import { StaffSkill } from './staff-skill.entity';
import { StaffCertification } from './staff-certification.entity';
import { SystemAssignment } from './system-assignment.entity';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { SkillsController } from './skills.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([StaffProfile, StaffSkill, StaffCertification, SystemAssignment]),
  ],
  providers: [StaffService],
  controllers: [StaffController, SkillsController],
  exports: [StaffService],
})
export class StaffModule {}
