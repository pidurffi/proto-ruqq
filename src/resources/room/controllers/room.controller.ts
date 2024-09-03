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
  UploadedFile,
  UseGuards,
  UseInterceptors,
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
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'

import { RoomService } from '../services/room.service'
import { RoomDto, RoomQueryDto, UpdateRoomDto } from '../dto/room.dto'
import { Room } from '../entities/room.entity'
import { GetUser, User, UserRoleGuard } from '../../../engine/auth/'
import { ValidRoles } from '../../../engine/auth/interfaces/index'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'
import { BaseController } from '../../../common/controllers/base.controller'

@Controller('/room')
@ApiTags('Room')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class RoomController extends BaseController<Room> {
  constructor(@Inject(RoomService) private readonly service: RoomService) {
    super()
  }

  getService(): RoomService {
    return this.service
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'List Room ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiForbiddenResponse({ status: 403, description: 'Forbidden.' })
  // @ApiOkResponse({ type: RoomPaginationDto })
  // @RoleProtected(ValidRoles.SUPER_ADMIN)
  // @UseGuards(AuthGuard(), UserRoleGuard)
  async findAll(@Query() query: RoomQueryDto) {
    return this.getService().findAllWithFilterPaginated(query)
  }

  @Get('all')
  @ApiResponse({
    status: 200,
    description: 'List Room ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiForbiddenResponse({ status: 403, description: 'Forbidden.' })
  // @ApiOkResponse({ type: RoomPaginationDto })
  // @RoleProtected(ValidRoles.SUPER_ADMIN)
  // @UseGuards(AuthGuard(), UserRoleGuard)
  async getAllRooms() {
    return this.getService().getAllRooms()
  }

  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'Room ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNotFoundResponse({ status: 404, description: 'Not Found.' })
  @ApiOkResponse({ type: Room, description: 'Room detail' })
  @ApiNotFoundResponse({ description: 'Room not found' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getService().getRoomById(id)
  }

  @Post('/')
  @ApiBody({ type: RoomDto, required: true })
  @ApiCreatedResponse({ type: Room, description: 'Room created' })
  @ApiResponse({
    status: 201,
    description: 'La habitación se ha creado correctamente',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async createRoom(@UploadedFile() file: Express.Multer.File, @Body() roomDto: RoomDto, @GetUser() user: User) {
    return this.getService().createRoom(file, roomDto, user.id)
  }

  @Patch('/:id')
  @ApiOkResponse({
    status: 200,
    description: 'The record has been successfully updated.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiNotFoundResponse({ status: 404, description: 'Not Found.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'Room updated' })
  @ApiNotFoundResponse({ description: 'The Room you want to update does not exist' })
  @HttpCode(HttpStatus.OK)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async updateRoom(
    @UploadedFile() file: Express.Multer.File,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @GetUser() user: User,
  ) {
    return this.getService().updateRoom(file, id, updateRoomDto, user.id)
  }

  @Delete('/:id')
  @ApiResponse({
    status: 200,
    description: 'Delete Room ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'Room deleted' })
  @ApiNotFoundResponse({ description: 'The Room you want to delete does not exist' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async deleteRoom(@Param('id', ParseUUIDPipe) id: string) {
    await this.getService().deleteRoom(id)
  }
}
