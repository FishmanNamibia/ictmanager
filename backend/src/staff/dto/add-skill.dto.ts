import { IsOptional, IsString, IsInt, IsIn, IsDateString, Min, Max } from 'class-validator';

const CATEGORIES = ['infrastructure','networking','security','applications','data','devops','service_management','soft_skills'];
const PRIORITIES = ['has_it','needed_now','needed_later'];

export class AddSkillDto {
  @IsString()
  skillName: string;

  @IsOptional() @IsIn(CATEGORIES) skillCategory?: string;

  @IsOptional() @IsInt() @Min(0) @Max(5) skillLevel?: number;

  @IsOptional() @IsDateString() lastUsed?: string;
  @IsOptional() @IsString() evidence?: string;
  @IsOptional() @IsIn(PRIORITIES) priority?: string;

  /** Legacy fields */
  @IsOptional() @IsString() level?: string;
  @IsOptional() @IsString() certificationName?: string;
  @IsOptional() @IsDateString() certificationExpiry?: string;
}
