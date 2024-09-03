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
import { FilesInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'

import { HotelImgService } from '../services/hotel-img.service'
import { HotelImgDto, HotelImgQueryDto, UpdateHotelImgDto } from '../dto/hotel-img.dto'
import { HotelImg } from '../entities/hotel-img.entity'
import { GetUser, User, UserRoleGuard } from '../../../engine/auth/'
import { ValidRoles } from '../../../engine/auth/interfaces/index'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'
import { BaseController } from '../../../common/controllers/base.controller'

@Controller('/hotel-img')
@ApiTags('HotelImg')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class HotelImgController extends BaseController<HotelImg> {
  constructor(@Inject(HotelImgService) private readonly service: HotelImgService) {
    super()
  }

  getService(): HotelImgService {
    return this.service
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'List HotelImg ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiForbiddenResponse({ status: 403, description: 'Forbidden.' })
  // @ApiOkResponse({ type: HotelImgPaginationDto })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async findAll(@Query() query: HotelImgQueryDto) {
    return this.getService().findAllWithFilterPaginated(query)
  }

  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'HotelImg ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNotFoundResponse({ status: 404, description: 'Not Found.' })
  @ApiOkResponse({ type: HotelImg, description: 'HotelImg detail' })
  @ApiNotFoundResponse({ description: 'HotelImg not found' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getService().findByIdOrFail(id)
  }

  @Post('upload-multiple')
  @ApiBody({ type: HotelImgDto, required: true })
  @ApiCreatedResponse({ type: HotelImg, description: 'HotelImg created' })
  @ApiResponse({
    status: 200,
    description: 'Post HotelImg ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
    }),
  )
  async createImgsHotel(
    @Body() hotelImgDto: HotelImgDto,
    @GetUser() user: User,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.getService().createImgsHotel(hotelImgDto, user.id, files)
  }

  @Delete('/:id')
  @ApiResponse({
    status: 200,
    description: 'Delete HotelImg ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'HotelImg deleted' })
  @ApiNotFoundResponse({ description: 'The HotelImg you want to delete does not exist' })
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
  @ApiNoContentResponse({ description: 'HotelImg updated' })
  @ApiNotFoundResponse({ description: 'The HotelImg you want to update does not exist' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async update(@Param('id') id: string, @Body() entity: UpdateHotelImgDto) {
    await this.getService().updateById(id, entity)
  }
}
