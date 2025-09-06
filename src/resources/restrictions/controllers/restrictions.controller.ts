import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'

import { RestrictionsService } from '../services/restrictions.service'
import { RestrictionsQueryDto, RestrictionsUpdateDto, RestrictionsCreateDto } from '../dto'
import { Restrictions } from '../entities/restrictions.entity'
import { ValidRoles } from '../../../engine/auth/interfaces/'
import { GetUser, User, UserRoleGuard } from '../../../engine/auth/'
import { PaginationDto } from '../../../common/'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'
import { BaseController } from '../../../common/controllers/base.controller'

@Controller('/restrictions')
@ApiTags('Restrictions')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class RestrictionsController extends BaseController<Restrictions> {
  constructor(@Inject(RestrictionsService) private readonly service: RestrictionsService) {
    super()
  }

  getService(): RestrictionsService {
    return this.service
  }

  @Get('/')
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiResponse({
    status: 200,
    description: 'List Restrictions ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiOkResponse({ type: Restrictions })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async findAll(@Query() restrictionsQueryDto: RestrictionsQueryDto) {
    return this.getService().findAllWithFilterPaginated(restrictionsQueryDto)
  }
  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'Restrictions ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiNotFoundResponse({ description: 'Not Found.' })
  @ApiOkResponse({ type: Restrictions, description: 'Restrictions detail' })
  @ApiNotFoundResponse({ description: 'Restrictions not found' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getService().findByIdOrFail(id)
  }

  @Post('/')
  @ApiBody({ type: RestrictionsCreateDto, required: true })
  @ApiCreatedResponse({ 
    type: [Restrictions], 
    description: 'Restrictions created (may return multiple restrictions after splitting)' 
  })
  @ApiResponse({
    status: 201,
    description: 'Restrictions created successfully with smart splitting applied.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async create(@Body() entity: RestrictionsCreateDto, @GetUser() user: User) {
    return this.getService().createRestrictions(entity, user.id)
  }

  @Delete('/:id')
  @ApiResponse({
    status: 200,
    description: 'Delete Restrictions ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'Restrictions deleted' })
  @ApiNotFoundResponse({
    description: 'The Restrictions you want to delete does not exist',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.getService().delete(id)
  }

  @Patch('/:id')
  @ApiOkResponse({
    description: 'The record has been successfully updated.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiNotFoundResponse({ description: 'Not Found.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'Restrictions updated' })
  @ApiNotFoundResponse({
    description: 'The Restrictions you want to update does not exist',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async update(@Param('id') id: string, @Body() entity: RestrictionsUpdateDto) {
    await this.getService().updateById(id, entity)
  }
}
