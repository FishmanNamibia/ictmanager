import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../tenant/decorators/tenant-id.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/roles';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER)
  @Post()
  async create(@TenantId() tenantId: string, @Body() dto: CreateUserDto) {
    const user = await this.usersService.create({
      tenantId,
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
      role: dto.role as Role,
      department: dto.department,
      jobTitle: dto.jobTitle,
    });
    return this.usersService.toPublic(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER, Role.ICT_STAFF)
  @Get()
  async list(@TenantId() tenantId: string) {
    const users = await this.usersService.findAllByTenant(tenantId);
    return users.map((u) => this.usersService.toPublic(u));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@TenantId() tenantId: string, @Param('id') id: string) {
    const user = await this.usersService.findById(id, tenantId);
    return this.usersService.toPublic(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER)
  @Patch(':id')
  patch(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(tenantId, id, {
      fullName: dto.fullName,
      email: dto.email,
      role: dto.role,
      active: dto.active,
      department: dto.department,
      jobTitle: dto.jobTitle,
      password: dto.password,
    });
  }
}
