import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CybersecurityService } from './cybersecurity.service';
import { CybersecurityController } from './cybersecurity.controller';
import { SecurityIncident, IncidentEvidence, IctRisk, Vulnerability, AccessReview, SecurityAuditEvidence } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SecurityIncident,
      IncidentEvidence,
      IctRisk,
      Vulnerability,
      AccessReview,
      SecurityAuditEvidence,
    ]),
  ],
  providers: [CybersecurityService],
  controllers: [CybersecurityController],
  exports: [CybersecurityService],
})
export class CybersecurityModule {}
