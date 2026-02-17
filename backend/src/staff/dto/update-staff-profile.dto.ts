import { PartialType } from '@nestjs/mapped-types';
import { CreateStaffProfileDto } from './create-staff-profile.dto';

export class UpdateStaffProfileDto extends PartialType(CreateStaffProfileDto) {}
