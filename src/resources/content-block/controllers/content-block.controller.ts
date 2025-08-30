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

import { ContentBlockService } from '../services/content-block.service'
import { ContentBlockQueryDto, ContentBlockUpdateDto, ContentBlockCreateDto } from '../dto'
import { ContentBlock } from '../entities/content-block.entity'
import { ValidRoles } from '../../../engine/auth/interfaces/'
import { GetUser, User, UserRoleGuard } from '../../../engine/auth/'
import { PaginationDto } from '../../../common/'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'
import { BaseController } from '../../../common/controllers/base.controller'

@Controller('/content-block')
@ApiTags('ContentBlock')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class ContentBlockController extends BaseController<ContentBlock> {
  constructor(@Inject(ContentBlockService) private readonly service: ContentBlockService) {
    super()
  }

  getService(): ContentBlockService {
    return this.service
  }

  @Get('/')
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiResponse({
    status: 200,
    description: 'List ContentBlock ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiOkResponse({ type: ContentBlock })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async findAll(@Query() contentBlockQueryDto: ContentBlockQueryDto) {
    return this.getService().findAllWithFilterPaginated(contentBlockQueryDto)
  }
  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'ContentBlock ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiNotFoundResponse({ description: 'Not Found.' })
  @ApiOkResponse({ type: ContentBlock, description: 'ContentBlock detail' })
  @ApiNotFoundResponse({ description: 'ContentBlock not found' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getService().findByIdOrFail(id)
  }

  @Post('/')
  @ApiBody({ type: ContentBlockCreateDto, required: true })
  @ApiCreatedResponse({ type: ContentBlock, description: 'ContentBlock created' })
  @ApiResponse({
    status: 200,
    description: 'Post ContentBlock ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async create(@Body() entity: ContentBlockCreateDto, @GetUser() user: User) {
    return this.getService().createContentBlock(entity, user.id)
  }

  @Delete('/:id')
  @ApiResponse({
    status: 200,
    description: 'Delete ContentBlock ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'ContentBlock deleted' })
  @ApiNotFoundResponse({
    description: 'The ContentBlock you want to delete does not exist',
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
  @ApiNoContentResponse({ description: 'ContentBlock updated' })
  @ApiNotFoundResponse({
    description: 'The ContentBlock you want to update does not exist',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async update(@Param('id') id: string, @Body() entity: ContentBlockUpdateDto) {
    await this.getService().updateById(id, entity)
  }
}
