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

import { MetatagsService } from '../services/metatags.service'
import { MetatagsDto, MetatagsQueryDto, UpdateMetatagsDto } from '../dto/metatags.dto'
import { Metatags } from '../entities/metatags.entity'
import { GetUser, User, UserRoleGuard } from '../../../engine/auth/'
import { ValidRoles } from '../../../engine/auth/interfaces/index'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'
import { BaseController } from '../../../common/controllers/base.controller'

@Controller('/metatags')
@ApiTags('Metatags')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class MetatagsController extends BaseController<Metatags> {
  constructor(@Inject(MetatagsService) private readonly service: MetatagsService) {
    super()
  }

  getService(): MetatagsService {
    return this.service
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'List Metatags ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiForbiddenResponse({ status: 403, description: 'Forbidden.' })
  // @ApiOkResponse({ type: MetatagsPaginationDto })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async findAll(@Query() query: MetatagsQueryDto) {
    return this.getService().findAllWithFilterPaginated(query)
  }

  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'Metatags ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNotFoundResponse({ status: 404, description: 'Not Found.' })
  @ApiOkResponse({ type: Metatags, description: 'Metatags detail' })
  @ApiNotFoundResponse({ description: 'Metatags not found' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getService().findByIdOrFail(id)
  }

  @Post('/')
  @ApiBody({ type: MetatagsDto, required: true })
  @ApiCreatedResponse({ type: Metatags, description: 'Metatags created' })
  @ApiResponse({
    status: 200,
    description: 'Post Metatags ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async createMetatags(@GetUser() user: User, @Body() metatagsDto: MetatagsDto) {
    return this.getService().createMetatags(metatagsDto, user.uid)
  }

  @Delete('/:id')
  @ApiResponse({
    status: 200,
    description: 'Delete Metatags ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'Metatags deleted' })
  @ApiNotFoundResponse({ description: 'The Metatags you want to delete does not exist' })
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
  @ApiNoContentResponse({ description: 'Metatags updated' })
  @ApiNotFoundResponse({ description: 'The Metatags you want to update does not exist' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async update(@GetUser() user: User, @Param('id') id: string, @Body() updateMetatagsDto: UpdateMetatagsDto) {
    await this.getService().updateMetatags(id, updateMetatagsDto, user.uid)
  }
}
