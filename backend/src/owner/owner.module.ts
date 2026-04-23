import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { OwnerService } from './owner.service';
import { OwnerController } from './owner.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, User]),
    UsersModule,
  ],
  providers: [OwnerService],
  controllers: [OwnerController],
  exports: [OwnerService],
})
export class OwnerModule {}
