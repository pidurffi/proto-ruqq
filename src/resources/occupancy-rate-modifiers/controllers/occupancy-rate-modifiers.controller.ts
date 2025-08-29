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

import { OccupancyRateModifiersService } from '../services/occupancy-rate-modifiers.service'
import { OccupancyRateModifiersQueryDto, OccupancyRateModifiersUpdateDto, OccupancyRateModifiersCreateDto } from '../dto'
import { OccupancyRateModifiers } from '../entities/occupancy-rate-modifiers.entity'
import { ValidRoles } from '../../../engine/auth/interfaces/'
import { GetUser, User, UserRoleGuard } from '../../../engine/auth/'
import { PaginationDto } from '../../../common/'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'
import { BaseController } from '../../../common/controllers/base.controller'

@Controller('/occupancy-rate-modifiers')
@ApiTags('OccupancyRateModifiers')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class OccupancyRateModifiersController extends BaseController<OccupancyRateModifiers> {
  constructor(@Inject(OccupancyRateModifiersService) private readonly service: OccupancyRateModifiersService) {
    super()
  }

  getService(): OccupancyRateModifiersService {
    return this.service
  }

  @Get('/')
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiResponse({
    status: 200,
    description: 'List OccupancyRateModifiers ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiOkResponse({ type: OccupancyRateModifiers })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async findAll(@Query() occupancyRateModifiersQueryDto: OccupancyRateModifiersQueryDto) {
    return this.getService().findAllWithFilterPaginated(occupancyRateModifiersQueryDto)
  }
  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'OccupancyRateModifiers ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiNotFoundResponse({ description: 'Not Found.' })
  @ApiOkResponse({ type: OccupancyRateModifiers, description: 'OccupancyRateModifiers detail' })
  @ApiNotFoundResponse({ description: 'OccupancyRateModifiers not found' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getService().findByIdOrFail(id)
  }

  @Post('/')
  @ApiBody({ type: OccupancyRateModifiersCreateDto, required: true })
  @ApiCreatedResponse({ type: OccupancyRateModifiers, description: 'OccupancyRateModifiers created' })
  @ApiResponse({
    status: 200,
    description: 'Post OccupancyRateModifiers ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async create(@Body() entity: OccupancyRateModifiersCreateDto, @GetUser() user: User) {
    return this.getService().createOccupancyRateModifiers(entity, user.id)
  }

  @Delete('/:id')
  @ApiResponse({
    status: 200,
    description: 'Delete OccupancyRateModifiers ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'OccupancyRateModifiers deleted' })
  @ApiNotFoundResponse({
    description: 'The OccupancyRateModifiers you want to delete does not exist',
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
  @ApiNoContentResponse({ description: 'OccupancyRateModifiers updated' })
  @ApiNotFoundResponse({
    description: 'The OccupancyRateModifiers you want to update does not exist',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async update(@Param('id') id: string, @Body() entity: OccupancyRateModifiersUpdateDto) {
    await this.getService().updateById(id, entity)
  }
}
