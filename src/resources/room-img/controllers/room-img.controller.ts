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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { FilesInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'

import { RoomImgService } from '../services/room-img.service'
import { RoomImgDto, RoomImgQueryDto, UpdateRoomImgDto } from '../dto/room-img.dto'
import { RoomImg } from '../entities/room-img.entity'
import { GetUser, User, UserRoleGuard } from '../../../engine/auth'
import { ValidRoles } from '../../../engine/auth/interfaces/index'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'
import { BaseController } from '../../../common/controllers/base.controller'

@Controller('/room-img')
@ApiTags('RoomImg')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class RoomImgController extends BaseController<RoomImg> {
  constructor(@Inject(RoomImgService) private readonly service: RoomImgService) {
    super()
  }

  getService(): RoomImgService {
    return this.service
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'List RoomImg ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiForbiddenResponse({ status: 403, description: 'Forbidden.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async findAll(@Query() query: RoomImgQueryDto) {
    return this.getService().findAllWithFilterPaginated(query)
  }

  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'RoomImg ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNotFoundResponse({ status: 404, description: 'Not Found.' })
  @ApiOkResponse({ type: RoomImg, description: 'RoomImg detail' })
  @ApiNotFoundResponse({ description: 'RoomImg not found' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getService().findByIdOrFail(id)
  }

  @Post('upload-multiple')
  @UseGuards(AuthGuard(), UserRoleGuard)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
    }),
  )
  async createImgsRoom(
    @Body() roomImgDto: RoomImgDto,
    @GetUser() user: User,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.getService().createImgsRoom(roomImgDto, user.id, files)
  }

  @Delete('/:id')
  @ApiResponse({
    status: 200,
    description: 'Delete RoomImg ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'RoomImg deleted' })
  @ApiNotFoundResponse({ description: 'The RoomImg you want to delete does not exist' })
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
  @ApiNoContentResponse({ description: 'RoomImg updated' })
  @ApiNotFoundResponse({ description: 'The RoomImg you want to update does not exist' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async update(@Param('id') id: string, @Body() entity: UpdateRoomImgDto) {
    await this.getService().updateById(id, entity)
  }
}
