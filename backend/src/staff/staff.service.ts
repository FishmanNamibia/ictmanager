import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffProfile } from './staff-profile.entity';
import { StaffSkill } from './staff-skill.entity';
import { CreateStaffProfileDto } from './dto/create-staff-profile.dto';
import { UpdateStaffProfileDto } from './dto/update-staff-profile.dto';
import { AddSkillDto } from './dto/add-skill.dto';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(StaffProfile)
    private readonly profileRepo: Repository<StaffProfile>,
    @InjectRepository(StaffSkill)
    private readonly skillRepo: Repository<StaffSkill>,
  ) {}

  async createProfile(tenantId: string, dto: CreateStaffProfileDto): Promise<StaffProfile> {
    const profile = this.profileRepo.create({ ...dto, tenantId });
    return this.profileRepo.save(profile);
  }

  async findAllProfiles(tenantId: string): Promise<StaffProfile[]> {
    return this.profileRepo.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }

  async findOneProfile(tenantId: string, id: string): Promise<StaffProfile> {
    const profile = await this.profileRepo.findOne({ where: { id, tenantId } });
    if (!profile) throw new NotFoundException('Staff profile not found');
    return profile;
  }

  async updateProfile(tenantId: string, id: string, dto: UpdateStaffProfileDto): Promise<StaffProfile> {
    await this.findOneProfile(tenantId, id);
    await this.profileRepo.update({ id, tenantId }, dto as Partial<StaffProfile>);
    return this.findOneProfile(tenantId, id);
  }

  async addSkill(tenantId: string, staffProfileId: string, dto: AddSkillDto): Promise<StaffSkill> {
    await this.findOneProfile(tenantId, staffProfileId);
    const skill = this.skillRepo.create({ ...dto, tenantId, staffProfileId });
    return this.skillRepo.save(skill);
  }

  async getSkillsForProfile(tenantId: string, staffProfileId: string): Promise<StaffSkill[]> {
    return this.skillRepo.find({ where: { tenantId, staffProfileId }, order: { skillName: 'ASC' } });
  }

  async removeSkill(tenantId: string, staffProfileId: string, skillId: string): Promise<void> {
    await this.skillRepo.delete({ id: skillId, tenantId, staffProfileId });
  }

  async getSkillsGapStats(tenantId: string): Promise<{ totalProfiles: number; totalSkills: number; certificationsExpiringSoon: number }> {
    const profiles = await this.profileRepo.find({ where: { tenantId } });
    const skills = await this.skillRepo.find({ where: { tenantId } });
    const now = new Date();
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    let certExpiring = 0;
    skills.forEach((s) => {
      if (s.certificationExpiry && s.certificationExpiry >= now && s.certificationExpiry <= in90Days) certExpiring++;
    });
    return { totalProfiles: profiles.length, totalSkills: skills.length, certificationsExpiringSoon: certExpiring };
  }
}
