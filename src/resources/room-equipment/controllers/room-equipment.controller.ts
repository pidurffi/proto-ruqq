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

import { RoomEquipmentService } from '../services/room-equipment.service'
import { RoomEquipmentDto, RoomEquipmentQueryDto } from '../dto/room-equipment.dto'
import { RoomEquipment } from '../entities/room-equipment.entity'
import { GetUser, User, UserRoleGuard } from '../../../engine/auth/'
import { ValidRoles } from '../../../engine/auth/interfaces/index'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'
import { BaseController } from '../../../common/controllers/base.controller'

@Controller('/room-equipment')
@ApiTags('RoomEquipment')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class RoomEquipmentController extends BaseController<RoomEquipment> {
  constructor(@Inject(RoomEquipmentService) private readonly service: RoomEquipmentService) {
    super()
  }

  getService(): RoomEquipmentService {
    return this.service
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'List RoomEquipment ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiForbiddenResponse({ status: 403, description: 'Forbidden.' })
  // @ApiOkResponse({ type: RoomEquipmentPaginationDto })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async findAll(@Query() query: RoomEquipmentQueryDto) {
    return this.getService().findAllWithFilterPaginated(query)
  }

  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'RoomEquipment ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNotFoundResponse({ status: 404, description: 'Not Found.' })
  @ApiOkResponse({ type: RoomEquipment, description: 'RoomEquipment detail' })
  @ApiNotFoundResponse({ description: 'RoomEquipment not found' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getService().findByIdOrFail(id)
  }

  @Post('/')
  @ApiBody({ type: RoomEquipmentDto, required: true })
  @ApiCreatedResponse({ type: RoomEquipment, description: 'RoomEquipment created' })
  @ApiResponse({
    status: 200,
    description: 'Post RoomEquipment ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async createRoomEquipment(@GetUser() user: User, @Body() roomEquipmentDto: RoomEquipmentDto) {
    return this.getService().createRoomEquipment(roomEquipmentDto, user.id)
  }

  @Delete('/:id')
  @ApiResponse({
    status: 200,
    description: 'Delete RoomEquipment ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'RoomEquipment deleted' })
  @ApiNotFoundResponse({ description: 'The RoomEquipment you want to delete does not exist' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.getService().delete(id)
  }
}
