import { IsString } from 'class-validator';

export class ResolveAssetVerificationDto {
  @IsString()
  resolutionNote: string;
}
