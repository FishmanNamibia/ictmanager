import { IsIn, IsOptional, IsString } from 'class-validator';
import { AssetDocumentType } from '../asset-document.entity';

const DOCUMENT_TYPES: AssetDocumentType[] = [
  'invoice',
  'delivery_note',
  'handover_form',
  'disposal_approval',
  'warranty',
  'audit_report',
  'image',
  'other',
];

export class CreateAssetDocumentDto {
  @IsIn(DOCUMENT_TYPES)
  documentType: AssetDocumentType;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
