import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
  UploadedFile,
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
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'

import { HotelService } from '../services/hotel.service'
import { UpdateHotelDto } from '../dto/hotel.dto'
import { Hotel } from '../entities/hotel.entity'
import { GetUser, User, UserRoleGuard } from '../../../engine/auth/'
import { ValidRoles } from '../../../engine/auth/interfaces/index'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'
import { BaseController } from '../../../common/controllers/base.controller'

@Controller('/hotel')
@ApiTags('Hotel')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class HotelController extends BaseController<Hotel> {
  constructor(@Inject(HotelService) private readonly service: HotelService) {
    super()
  }

  getService(): HotelService {
    return this.service
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'List Hotel ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiForbiddenResponse({ status: 403, description: 'Forbidden.' })
  // @ApiOkResponse({ type: HotelPaginationDto })
  // @RoleProtected(ValidRoles.SUPER_ADMIN)
  // @UseGuards(AuthGuard(), UserRoleGuard)
  async getHotel() {
    return this.getService().getHotel()
  }

  @Get('sections')
  @ApiResponse({
    status: 200,
    description: 'List Hotel ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiForbiddenResponse({ status: 403, description: 'Forbidden.' })
  // @ApiOkResponse({ type: HotelPaginationDto })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async sections() {
    return this.getService().getSections()
  }

  @Patch()
  @ApiOkResponse({
    status: 201,
    description: 'The record has been successfully updated.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiNotFoundResponse({ status: 404, description: 'Not Found.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'Hotel updated' })
  @ApiNotFoundResponse({ description: 'The Hotel you want to update does not exist' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async updateHotel(
    @UploadedFile() file: Express.Multer.File,
    @Body() updateHotelDto: UpdateHotelDto,
    @GetUser() user: User,
  ) {
    return this.getService().updateHotel(file, '00000000-0000-0000-0000-000000000000', updateHotelDto, user.id)
  }
}
