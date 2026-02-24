import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { SecurityIncident } from './security-incident.entity';

@Entity('incident_evidence')
export class IncidentEvidence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  incidentId: string;

  @ManyToOne(() => SecurityIncident, (incident) => incident.evidence, { onDelete: 'CASCADE' })
  incident: SecurityIncident;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  fileUrl: string; // URL to uploaded evidence file

  @Column({ type: 'varchar', length: 100, nullable: true })
  fileType: string; // e.g. log, screenshot, report

  @CreateDateColumn()
  createdAt: Date;
}
