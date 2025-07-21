import { Controller, Get, Post, Body, UseGuards, Patch, ParseUUIDPipe, Param } from '@nestjs/common'
import { ApiBadRequestResponse, ApiForbiddenResponse, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'

import { AuthService } from '../services/auth.service'
import { CreateUserDto, LoginUserDto, PromoteUserDto, UpdateUserDto } from '../dto'
import { GetUser, Auth } from '../decorators'
import { RoleProtected } from '../decorators/role-protected.decorator'
import { UserRoleGuard } from '../guards/user-role.guard'
import { ValidRoles } from '../interfaces/valid-roles'
import { User } from '../entities'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto)
  }

  @Post('register')
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  create(@Body() createUserDto: CreateUserDto, @GetUser() user: User) {
    return this.authService.create(createUserDto, user.id)
  }

  @Patch(':id')
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUserDto: UpdateUserDto, @GetUser() user: User) {
    return this.authService.update(id, updateUserDto, user)
  }

  @Get('all')
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  getAll() {
    return this.authService.getAllUsers()
  }

  @Get('checkAuth')
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  @Auth()
  checkAuthStatus(@GetUser(['id']) id: string) {
    return this.authService.checkAuthStatus(id)
  }

  @Post('promote')
  @RoleProtected(ValidRoles.SUPER_ADMIN) //solo para los que son de administracion de sistema
  @UseGuards(AuthGuard(), UserRoleGuard)
  promotion(@Body() promoteUserDto: PromoteUserDto) {
    return this.authService.promote(promoteUserDto)
  }
}
