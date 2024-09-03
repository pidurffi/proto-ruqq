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

import { PopupService } from '../services/popup.service'
import { UpdatePopupDto } from '../dto/popup.dto'
import { Popup } from '../entities/popup.entity'
import { GetUser, User, UserRoleGuard } from '../../../engine/auth/'
import { ValidRoles } from '../../../engine/auth/interfaces/index'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'
import { BaseController } from '../../../common/controllers/base.controller'

@Controller('/popup')
@ApiTags('Popup')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class PopupController extends BaseController<Popup> {
  constructor(@Inject(PopupService) private readonly service: PopupService) {
    super()
  }

  getService(): PopupService {
    return this.service
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'List Popup ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiForbiddenResponse({ status: 403, description: 'Forbidden.' })
  // @ApiOkResponse({ type: PopupPaginationDto })
  // @RoleProtected(ValidRoles.SUPER_ADMIN)
  // @UseGuards(AuthGuard(), UserRoleGuard)
  async getPopup() {
    return this.getService().getPopup()
  }

  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'Popup ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNotFoundResponse({ status: 404, description: 'Not Found.' })
  @ApiOkResponse({ type: Popup, description: 'Popup detail' })
  @ApiNotFoundResponse({ description: 'Popup not found' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getService().findByIdOrFail(id)
  }

  @Delete('/:id')
  @ApiResponse({
    status: 200,
    description: 'Delete Popup ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'Popup deleted' })
  @ApiNotFoundResponse({ description: 'The Popup you want to delete does not exist' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.getService().delete(id)
  }

  @Patch()
  @ApiOkResponse({
    status: 201,
    description: 'The record has been successfully updated.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiNotFoundResponse({ status: 404, description: 'Not Found.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'Popup updated' })
  @ApiNotFoundResponse({ description: 'The Popup you want to update does not exist' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async updatePopup(
    @UploadedFile() file: Express.Multer.File,
    @Body() updatePopupDto: UpdatePopupDto,
    @GetUser() user: User,
  ) {
    await this.getService().updatePopup(file, '00000000-0000-0000-0000-000000000001', updatePopupDto, user.id)
  }
}
