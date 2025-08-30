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

import { QuoteTemplateService } from '../services/quote-template.service'
import { QuoteTemplateQueryDto, QuoteTemplateUpdateDto, QuoteTemplateCreateDto } from '../dto'
import { QuoteTemplate } from '../entities/quote-template.entity'
import { ValidRoles } from '../../../engine/auth/interfaces/'
import { GetUser, User, UserRoleGuard } from '../../../engine/auth/'
import { PaginationDto } from '../../../common/'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'
import { BaseController } from '../../../common/controllers/base.controller'

@Controller('/quote-template')
@ApiTags('QuoteTemplate')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class QuoteTemplateController extends BaseController<QuoteTemplate> {
  constructor(@Inject(QuoteTemplateService) private readonly service: QuoteTemplateService) {
    super()
  }

  getService(): QuoteTemplateService {
    return this.service
  }

  @Get('/')
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiResponse({
    status: 200,
    description: 'List QuoteTemplate ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiOkResponse({ type: QuoteTemplate })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async findAll(@Query() quoteTemplateQueryDto: QuoteTemplateQueryDto) {
    return this.getService().findAllWithFilterPaginated(quoteTemplateQueryDto)
  }
  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'QuoteTemplate ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiNotFoundResponse({ description: 'Not Found.' })
  @ApiOkResponse({ type: QuoteTemplate, description: 'QuoteTemplate detail' })
  @ApiNotFoundResponse({ description: 'QuoteTemplate not found' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getService().findByIdOrFail(id)
  }

  @Post('/')
  @ApiBody({ type: QuoteTemplateCreateDto, required: true })
  @ApiCreatedResponse({ type: QuoteTemplate, description: 'QuoteTemplate created' })
  @ApiResponse({
    status: 200,
    description: 'Post QuoteTemplate ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async create(@Body() entity: QuoteTemplateCreateDto, @GetUser() user: User) {
    return this.getService().createQuoteTemplate(entity, user.id)
  }

  @Delete('/:id')
  @ApiResponse({
    status: 200,
    description: 'Delete QuoteTemplate ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'QuoteTemplate deleted' })
  @ApiNotFoundResponse({
    description: 'The QuoteTemplate you want to delete does not exist',
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
  @ApiNoContentResponse({ description: 'QuoteTemplate updated' })
  @ApiNotFoundResponse({
    description: 'The QuoteTemplate you want to update does not exist',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async update(@Param('id') id: string, @Body() entity: QuoteTemplateUpdateDto) {
    await this.getService().updateById(id, entity)
  }
}
