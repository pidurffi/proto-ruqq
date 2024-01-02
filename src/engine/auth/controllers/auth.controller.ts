import { Controller, Get, Post, Body, UseGuards, Patch, ParseUUIDPipe, Param } from '@nestjs/common'
import { ApiBadRequestResponse, ApiForbiddenResponse, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'

import { AuthService } from '../services/auth.service'
import { CreateUserDto, LoginUserDto, PromoteUserDto, UpdateUserDto } from '../dto'
import { GetUser, Auth } from '../decorators'
import { RoleProtected } from '../decorators/role-protected.decorator'
import { UserRoleGuard } from '../guards/user-role.guard'
import { ValidModules } from '../interfaces/valid-modules'
import { User } from '../entities'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiForbiddenResponse({ status: 403, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @RoleProtected(ValidModules.super)
  @UseGuards(AuthGuard(), UserRoleGuard)
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto)
  }

  @Patch(':id')
  @ApiForbiddenResponse({ status: 403, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @RoleProtected(ValidModules.super)
  @UseGuards(AuthGuard(), UserRoleGuard)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUserDto: UpdateUserDto, @GetUser() user: User) {
    return this.authService.update(id, updateUserDto, user)
  }

  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto)
  }

  @Get('all')
  @RoleProtected(ValidModules.super)
  @UseGuards(AuthGuard(), UserRoleGuard)
  getAll() {
    return this.authService.getAllUsers()
  }

  @Get('checkAuth')
  @Auth()
  checkAuthStatus(@GetUser(['id']) id: string) {
    return this.authService.checkAuthStatus(id)
  }

  @Post('promote')
  @RoleProtected(ValidModules.super) //solo para los que son de administracion de sistema
  @UseGuards(AuthGuard(), UserRoleGuard)
  promotion(@Body() promoteUserDto: PromoteUserDto) {
    return this.authService.promote(promoteUserDto)
  }
}
