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
import { TemplateDto, TemplateQueryDto, UpdateTemplateDto } from '../dto/template'
import { Template } from '../entities/template'
import { GetUser, User, UserRoleGuard } from '../../../auth/'
import { ValidRoles } from '../../../auth/interfaces/index'
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

  @Get()
  @ApiResponse({
    status: 200,
    description: 'List Template ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiForbiddenResponse({ status: 403, description: 'Forbidden.' })
  // @ApiOkResponse({ type: TemplatePaginationDto })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async findAll(@Query() query: TemplateQueryDto) {
    return this.getService().findAllWithFilterPaginated(query)
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
  @RoleProtected(ValidRoles.SUPER_ADMIN)
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
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async createTemplate(@GetUser() user: User, @Body() templateDto: TemplateDto) {
    return this.getService().createTemplate(templateDto, user.uid)
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
  @RoleProtected(ValidRoles.SUPER_ADMIN)
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
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async update(@GetUser() user: User, @Param('id') id: string, @Body() updateTemplateDto: UpdateTemplateDto) {
    await this.getService().updateTemplate(id, updateTemplateDto, user.uid)
  }
}
