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
import { TemplateDto, TemplatePaginationDto, UpdateTemplateDto } from '../dto/template'
import { Template } from '../entities/template'
import { UserRoleGuard, ValidModules } from '../../../auth/'
import { PaginationDto } from '../../../../common/'
import { RoleProtected } from '../../../auth/decorators/role-protected.decorator'
import { BaseController } from '../../../../common/controllers/base.controller'

@Controller('/template')
@ApiTags('Template')
@RoleProtected(ValidModules.template)
export class TemplateController extends BaseController<Template> {
  constructor(@Inject(TemplateService) private readonly service: TemplateService) {
    super()
  }

  getService(): TemplateService {
    return this.service
  }

  @Get('/')
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({
    status: 200,
    description: 'List Template ok.',
  })
  @ApiForbiddenResponse({ status: 403, description: 'Forbidden.' })
  @ApiOkResponse({ type: TemplatePaginationDto })
  @RoleProtected(ValidModules.templateAll)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async findAll(@Query() paginationDto: PaginationDto<Template>) {
    if (paginationDto) return this.getService().findAll()
  }

  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'Template ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNotFoundResponse({ status: 404, description: 'Not Found.' })
  @ApiOkResponse({ type: Template, description: 'Template detail' })
  @ApiNotFoundResponse({ description: 'Template not found' })
  @RoleProtected(ValidModules.templateOne)
  @UseGuards(AuthGuard(), UserRoleGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getService().findByIdOrFail(id)
  }

  @Post('/')
  @ApiBody({ type: TemplateDto, required: true })
  @ApiCreatedResponse({ type: Template, description: 'Template created' })
  @ApiResponse({
    status: 200,
    description: 'Post Template ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @RoleProtected(ValidModules.templateCreate)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async save(@Body() entity: TemplateDto) {
    return this.getService().create(entity)
  }

  @Delete('/:id')
  @ApiResponse({
    status: 200,
    description: 'Delete Template ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'Template deleted' })
  @ApiNotFoundResponse({ description: 'The Template you want to delete does not exist' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidModules.templateRemove)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.getService().delete(id)
  }

  @Patch('/:id')
  @ApiOkResponse({
    status: 201,
    description: 'The record has been successfully updated.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiNotFoundResponse({ status: 404, description: 'Not Found.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'Template updated' })
  @ApiNotFoundResponse({ description: 'The Template you want to update does not exist' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidModules.templateUpdate)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async update(@Param('id') id: string, @Body() entity: UpdateTemplateDto) {
    await this.getService().updateById(id, entity)
  }
}
