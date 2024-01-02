import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'

import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'
import { GetUser, User, UserRoleGuard, ValidRoles } from '../../../engine/auth/'
import { PaginationDto } from '../../../common/'
import { Entidadmodelo } from '../entities/'
import { EntidadmodeloService } from '../services/'
import { CreateEntidadmodeloDto } from '../dto/create-entidadmodelo.dto'
import { UpdateEntidadmodeloDto } from '../dto/update-entidadmodelo.dto'
import { BaseController } from '../../../common/controllers/base.controller'

@ApiTags('Entidades Prueba')
@Controller('entidad-modelo')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class EntidadmodeloController extends BaseController<Entidadmodelo> {
  constructor(private readonly entidadmodeloService: EntidadmodeloService) {
    super()
  }

  protected getService(): EntidadmodeloService {
    return this.entidadmodeloService
  }

  @Post()
  @ApiResponse({
    status: 200,
    description: 'Post ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @RoleProtected(ValidRoles.USER)
  @UseGuards(AuthGuard(), UserRoleGuard)
  create(@Body() createEntidadmodeloDto: CreateEntidadmodeloDto, @GetUser() user: User) {
    return this.getService().createEntidadmodelo(createEntidadmodeloDto, user.id)
  }

  @Get()
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({
    status: 200,
    description: 'List entidadmodelo ok.',
  })
  @ApiForbiddenResponse({ status: 403, description: 'Forbidden.' })
  @RoleProtected(ValidRoles.USER)
  @UseGuards(AuthGuard(), UserRoleGuard)
  findAll(@Query() paginationDto: PaginationDto<Entidadmodelo>) {
    if (paginationDto) return this.getService().findAll()
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'entidadmodelo ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNotFoundResponse({ status: 404, description: 'Not Found.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getService().findOne(id)
  }

  @Patch(':id')
  @ApiOkResponse({
    status: 201,
    description: 'The record has been successfully updated.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiNotFoundResponse({ status: 404, description: 'Not Found.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEntidadmodeloDto: UpdateEntidadmodeloDto,
    @GetUser() user: User,
  ) {
    return this.getService().update(id, updateEntidadmodeloDto, user)
  }

  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: 'Delete ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.getService().remove(id)
  }
}
