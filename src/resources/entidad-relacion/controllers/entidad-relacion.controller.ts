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
import { GetUser, User, UserRoleGuard, ValidModules } from '../../../engine/auth'
import { PaginationDto } from '../../../common'
import { CreateEntidadRelacionDto } from '../dto/create-entidad-relacion.dto'
import { UpdateEntidadRelacionDto } from '../dto/update-entidad-relacion.dto'
import { EntidadRelacion } from '../entities/entidad-relacion.entity'
import { EntidadRelacionService } from '../services/'
import { BaseController } from '../../../common/controllers/base.controller'

@ApiTags('Entidades Prueba')
@Controller('entidad-relacion')
@RoleProtected(ValidModules.entidadRelacion)
export class EntidadRelacionController extends BaseController<EntidadRelacion> {
  constructor(private readonly entidadRelacionService: EntidadRelacionService) {
    super()
  }

  protected getService(): EntidadRelacionService {
    return this.entidadRelacionService
  }

  @Post()
  @ApiResponse({
    status: 200,
    description: 'Post ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @RoleProtected(ValidModules.entidadRelacionCreate)
  @UseGuards(AuthGuard(), UserRoleGuard)
  create(@Body() createEntidadRelacionDto: CreateEntidadRelacionDto, @GetUser() user: User) {
    return this.getService().createEntidadRelacion(createEntidadRelacionDto, user.id)
  }

  @Get()
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({
    status: 200,
    description: 'List entidadRelacion ok.',
  })
  @ApiForbiddenResponse({ status: 403, description: 'Forbidden.' })
  @RoleProtected(ValidModules.entidadRelacionAll)
  @UseGuards(AuthGuard(), UserRoleGuard)
  findAll(@Query() paginationDto: PaginationDto<EntidadRelacion>) {
    if (paginationDto) return this.getService().findAll()
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'entidadRelacion ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNotFoundResponse({ status: 404, description: 'Not Found.' })
  @RoleProtected(ValidModules.entidadRelacionOne)
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
  @RoleProtected(ValidModules.entidadRelacionUpdate)
  @UseGuards(AuthGuard(), UserRoleGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEntidadRelacionDto: UpdateEntidadRelacionDto,
    @GetUser() user: User,
  ) {
    return this.getService().update(id, updateEntidadRelacionDto, user)
  }

  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: 'Delete ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @RoleProtected(ValidModules.entidadRelacionRemove)
  @UseGuards(AuthGuard(), UserRoleGuard)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.getService().remove(id)
  }
}
