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

import { SectionImgService } from '../services/section-img.service'
import { SectionImgDto, SectionImgQueryDto, UpdateSectionImgDto } from '../dto/section-img.dto'
import { SectionImg } from '../entities/section-img.entity'
import { GetUser, User, UserRoleGuard } from '../../../engine/auth'
import { ValidRoles } from '../../../engine/auth/interfaces/index'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'
import { BaseController } from '../../../common/controllers/base.controller'

@Controller('/section-img')
@ApiTags('SectionImg')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class SectionImgController extends BaseController<SectionImg> {
  constructor(@Inject(SectionImgService) private readonly service: SectionImgService) {
    super()
  }

  getService(): SectionImgService {
    return this.service
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'List SectionImg ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiForbiddenResponse({ status: 403, description: 'Forbidden.' })
  // @ApiOkResponse({ type: SectionImgPaginationDto })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async findAll(@Query() query: SectionImgQueryDto) {
    return this.getService().findAllWithFilterPaginated(query)
  }

  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'SectionImg ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNotFoundResponse({ status: 404, description: 'Not Found.' })
  @ApiOkResponse({ type: SectionImg, description: 'SectionImg detail' })
  @ApiNotFoundResponse({ description: 'SectionImg not found' })
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
    @Body() sectionImgDto: SectionImgDto,
    @GetUser() user: User,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.getService().createImgsRoom(sectionImgDto, user.id, files)
  }

  @Delete('/:id')
  @ApiResponse({
    status: 200,
    description: 'Delete SectionImg ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'SectionImg deleted' })
  @ApiNotFoundResponse({ description: 'The SectionImg you want to delete does not exist' })
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
  @ApiNoContentResponse({ description: 'SectionImg updated' })
  @ApiNotFoundResponse({ description: 'The SectionImg you want to update does not exist' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async update(@Param('id') id: string, @Body() entity: UpdateSectionImgDto) {
    await this.getService().updateById(id, entity)
  }
}
