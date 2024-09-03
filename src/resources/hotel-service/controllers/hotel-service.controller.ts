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

import { HotelServiceService } from '../services/hotel-service.service'
import { HotelServiceDto, HotelServiceQueryDto, UpdateHotelServiceDto } from '../dto/hotel-service.dto'
import { HotelService } from '../entities/hotel-service.entity'
import { GetUser, User, UserRoleGuard } from '../../../engine/auth/'
import { ValidRoles } from '../../../engine/auth/interfaces/index'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'
import { BaseController } from '../../../common/controllers/base.controller'

@Controller('/hotel-service')
@ApiTags('HotelService')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class HotelServiceController extends BaseController<HotelService> {
  constructor(@Inject(HotelServiceService) private readonly service: HotelServiceService) {
    super()
  }

  getService(): HotelServiceService {
    return this.service
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'List HotelService ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiForbiddenResponse({ status: 403, description: 'Forbidden.' })
  // @ApiOkResponse({ type: HotelServicePaginationDto })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async findAll(@Query() query: HotelServiceQueryDto) {
    return this.getService().findAllWithFilterPaginated(query)
  }

  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'HotelService ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNotFoundResponse({ status: 404, description: 'Not Found.' })
  @ApiOkResponse({ type: HotelService, description: 'HotelService detail' })
  @ApiNotFoundResponse({ description: 'HotelService not found' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getService().findByIdOrFail(id)
  }

  @Post('/')
  @ApiBody({ type: HotelServiceDto, required: true })
  @ApiCreatedResponse({ type: HotelService, description: 'HotelService created' })
  @ApiResponse({
    status: 200,
    description: 'Post HotelService ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async createHotelService(@GetUser() user: User, @Body() hotelServiceDto: HotelServiceDto) {
    return this.getService().createHotelService(hotelServiceDto, user.uid)
  }

  @Delete('/:id')
  @ApiResponse({
    status: 200,
    description: 'Delete HotelService ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'HotelService deleted' })
  @ApiNotFoundResponse({ description: 'The HotelService you want to delete does not exist' })
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
  @ApiNoContentResponse({ description: 'HotelService updated' })
  @ApiNotFoundResponse({ description: 'The HotelService you want to update does not exist' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async update(@GetUser() user: User, @Param('id') id: string, @Body() updateHotelServiceDto: UpdateHotelServiceDto) {
    await this.getService().updateHotelService(id, updateHotelServiceDto, user.uid)
  }
}
