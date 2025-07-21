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

import { TemplateService } from '../services/template'
import { TemplateQueryDto, TemplateUpdateDto, TemplateCreateDto } from '../dto'
import { Template } from '../entities/template'
import { ValidRoles } from '../../../auth/interfaces/'
import { GetUser, User, UserRoleGuard } from '../../../auth/'
import { PaginationDto } from '../../../../common/'
import { RoleProtected } from '../../../auth/decorators/role-protected.decorator'
import { BaseController } from '../../../../common/controllers/base.controller'

@Controller('/template')
@ApiTags('Template')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class TemplateController extends BaseController<Template> {
  constructor(@Inject(TemplateService) private readonly service: TemplateService) {
    super()
  }

  getService(): TemplateService {
    return this.service
  }

  @Get('/')
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiResponse({
    status: 200,
    description: 'List Template ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiOkResponse({ type: Template })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async findAll(@Query() templateQueryDto: TemplateQueryDto) {
    return this.getService().findAllWithFilterPaginated(templateQueryDto)
  }
  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'Template ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiNotFoundResponse({ description: 'Not Found.' })
  @ApiOkResponse({ type: Template, description: 'Template detail' })
  @ApiNotFoundResponse({ description: 'Template not found' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getService().findByIdOrFail(id)
  }

  @Post('/')
  @ApiBody({ type: TemplateCreateDto, required: true })
  @ApiCreatedResponse({ type: Template, description: 'Template created' })
  @ApiResponse({
    status: 200,
    description: 'Post Template ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async create(@Body() entity: TemplateCreateDto, @GetUser() user: User) {
    return this.getService().createTemplate(entity, user.id)
  }

  @Delete('/:id')
  @ApiResponse({
    status: 200,
    description: 'Delete Template ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'Template deleted' })
  @ApiNotFoundResponse({
    description: 'The Template you want to delete does not exist',
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
  @ApiNoContentResponse({ description: 'Template updated' })
  @ApiNotFoundResponse({
    description: 'The Template you want to update does not exist',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async update(@Param('id') id: string, @Body() entity: TemplateUpdateDto) {
    await this.getService().updateById(id, entity)
  }
}
