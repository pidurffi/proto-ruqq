import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiResponse, ApiTags } from '@nestjs/swagger'

import { RoleService } from '../services/role.service'
import { UserRoleGuard } from '../guards/user-role.guard'
import { RoleProtected } from '../decorators/role-protected.decorator'
import { ValidModules } from '../interfaces'
import { CreateRoleDto, PromoteRoleDto } from '../dto'
import { User } from '../entities'
import { GetUser } from '../decorators'

@ApiTags('Roles')
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post('/')
  @ApiResponse({
    status: 200,
    description: 'Post ok.',
  })
  @RoleProtected(ValidModules.super)
  @UseGuards(AuthGuard(), UserRoleGuard)
  create(@Body() createRoleDto: CreateRoleDto, @GetUser() user: User) {
    return this.roleService.createRole(createRoleDto, user)
  }

  @Get('modules/')
  @RoleProtected(ValidModules.super)
  @UseGuards(AuthGuard(), UserRoleGuard)
  allModulesRoute() {
    return this.roleService.getModules()
  }

  @Get('all')
  @RoleProtected(ValidModules.super)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async allRolesRoute() {
    return this.roleService.findAll()
  }

  @Get('active')
  @RoleProtected(ValidModules.super)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async activeRolesRoute() {
    return this.roleService.findActiveRoles()
  }

  @Post('promote')
  @RoleProtected(ValidModules.super)
  promotion(@Body() promoteRoleDto: PromoteRoleDto) {
    return this.roleService.promote(promoteRoleDto)
  }
}
