import { IsOptional, IsString, IsDateString } from 'class-validator';

export class AddSkillDto {
  @IsString()
  skillName: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsString()
  certificationName?: string;

  @IsOptional()
  @IsDateString()
  certificationExpiry?: string;
}
