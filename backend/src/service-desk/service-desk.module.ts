import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceDeskService } from './service-desk.service';
import { ServiceDeskController } from './service-desk.controller';
import { ServiceTicket, TicketComment } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceTicket, TicketComment])],
  providers: [ServiceDeskService],
  controllers: [ServiceDeskController],
  exports: [ServiceDeskService],
})
export class ServiceDeskModule {}
