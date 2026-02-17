import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../tenant/decorators/tenant-id.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/roles';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER)
  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateUserDto) {
    return this.usersService.create({
      tenantId,
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
      role: dto.role as Role,
      department: dto.department,
      jobTitle: dto.jobTitle,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER, Role.ICT_STAFF)
  @Get()
  list(@TenantId() tenantId: string) {
    return this.usersService.findAllByTenant(tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getById(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.usersService.findById(id, tenantId);
  }
}
