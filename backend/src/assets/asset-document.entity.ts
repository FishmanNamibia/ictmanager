import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type AssetDocumentType =
  | 'invoice'
  | 'delivery_note'
  | 'handover_form'
  | 'disposal_approval'
  | 'warranty'
  | 'audit_report'
  | 'image'
  | 'other';

@Entity('asset_documents')
@Index(['tenantId', 'assetId', 'createdAt'])
export class AssetDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'asset_id' })
  assetId: string;

  @Column({ name: 'document_type', type: 'varchar', length: 30 })
  documentType: AssetDocumentType;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ name: 'reference_number', type: 'varchar', nullable: true })
  referenceNumber: string | null;

  @Column({ name: 'file_name', type: 'varchar' })
  fileName: string;

  @Column({ name: 'mime_type', type: 'varchar' })
  mimeType: string;

  @Column({ name: 'size_bytes', type: 'int' })
  sizeBytes: number;

  @Column({ type: 'bytea', select: false })
  content: Buffer;

  @Column({ name: 'uploaded_by_user_id', type: 'varchar', nullable: true })
  uploadedByUserId: string | null;

  @Column({ name: 'uploaded_by_name', type: 'varchar', nullable: true })
  uploadedByName: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
