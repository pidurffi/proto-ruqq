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

import { QuoteTemplateBlockService } from '../services/quote-template-block.service'
import { QuoteTemplateBlockQueryDto, QuoteTemplateBlockUpdateDto, QuoteTemplateBlockCreateDto } from '../dto'
import { QuoteTemplateBlock } from '../entities/quote-template-block.entity'
import { ValidRoles } from '../../../engine/auth/interfaces/'
import { GetUser, User, UserRoleGuard } from '../../../engine/auth/'
import { PaginationDto } from '../../../common/'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'
import { BaseController } from '../../../common/controllers/base.controller'

@Controller('/quote-template-block')
@ApiTags('QuoteTemplateBlock')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class QuoteTemplateBlockController extends BaseController<QuoteTemplateBlock> {
  constructor(@Inject(QuoteTemplateBlockService) private readonly service: QuoteTemplateBlockService) {
    super()
  }

  getService(): QuoteTemplateBlockService {
    return this.service
  }

  @Get('/')
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiResponse({
    status: 200,
    description: 'List QuoteTemplateBlock ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiOkResponse({ type: QuoteTemplateBlock })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async findAll(@Query() quoteTemplateBlockQueryDto: QuoteTemplateBlockQueryDto) {
    return this.getService().findAllWithFilterPaginated(quoteTemplateBlockQueryDto)
  }
  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'QuoteTemplateBlock ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiNotFoundResponse({ description: 'Not Found.' })
  @ApiOkResponse({ type: QuoteTemplateBlock, description: 'QuoteTemplateBlock detail' })
  @ApiNotFoundResponse({ description: 'QuoteTemplateBlock not found' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getService().findByIdOrFail(id)
  }

  @Post('/')
  @ApiBody({ type: QuoteTemplateBlockCreateDto, required: true })
  @ApiCreatedResponse({ type: QuoteTemplateBlock, description: 'QuoteTemplateBlock created' })
  @ApiResponse({
    status: 200,
    description: 'Post QuoteTemplateBlock ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async create(@Body() entity: QuoteTemplateBlockCreateDto, @GetUser() user: User) {
    return this.getService().createQuoteTemplateBlock(entity, user.id)
  }

  @Delete('/:id')
  @ApiResponse({
    status: 200,
    description: 'Delete QuoteTemplateBlock ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'QuoteTemplateBlock deleted' })
  @ApiNotFoundResponse({
    description: 'The QuoteTemplateBlock you want to delete does not exist',
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
  @ApiNoContentResponse({ description: 'QuoteTemplateBlock updated' })
  @ApiNotFoundResponse({
    description: 'The QuoteTemplateBlock you want to update does not exist',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async update(@Param('id') id: string, @Body() entity: QuoteTemplateBlockUpdateDto) {
    await this.getService().updateById(id, entity)
  }
}
