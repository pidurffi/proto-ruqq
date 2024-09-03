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

import { BannerService } from '../services/banner.service'
import { BannerDto, BannerQueryDto, UpdateBannerDto } from '../dto/banner.dto'
import { Banner } from '../entities/banner.entity'
import { GetUser, User, UserRoleGuard } from '../../../engine/auth/'
import { ValidRoles } from '../../../engine/auth/interfaces/index'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'
import { BaseController } from '../../../common/controllers/base.controller'
import {
  ProcessedBanner,
  BannerCreationResult,
  BannerDeletionResult,
  BannerUpdateResult,
} from '../interfaces/banner.interface'

@Controller('/banner')
@ApiTags('Banner')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class BannerController extends BaseController<Banner> {
  constructor(@Inject(BannerService) private readonly service: BannerService) {
    super()
  }

  getService(): BannerService {
    return this.service
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Listar Banners ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Prohibido.' })
  @ApiBadRequestResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @ApiForbiddenResponse({ status: 403, description: 'Prohibido.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async findAll(@Query() query: BannerQueryDto) {
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
  async getAllBanners(): Promise<ProcessedBanner[]> {
    return this.getService().getAllBanners()
  }

  @Get('promotions-by-filter/:cant')
  @ApiResponse({
    status: 200,
    description: 'List Room ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiForbiddenResponse({ status: 403, description: 'Forbidden.' })
  async getPromotionsByFilter(@Param('cant') cant: number): Promise<ProcessedBanner[]> {
    return this.getService().getPromotionsByFilter(cant)
  }

  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'Banner encontrado.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Prohibido.' })
  @ApiBadRequestResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @ApiNotFoundResponse({ status: 404, description: 'No encontrado.' })
  @ApiOkResponse({ type: Banner, description: 'Detalle del Banner' })
  @ApiNotFoundResponse({ description: 'Banner no encontrado' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProcessedBanner> {
    return this.getService().getBannerById(id)
  }

  @Post('/')
  @ApiBody({ type: BannerDto, required: true })
  @ApiCreatedResponse({ type: Banner, description: 'Banner creado' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async createBanner(
    @UploadedFile() file: Express.Multer.File,
    @Body() bannerDto: BannerDto,
    @GetUser() user: User,
  ): Promise<BannerCreationResult> {
    return this.getService().createBanner(file, bannerDto, user)
  }

  @Delete('/:id')
  @ApiResponse({
    status: 200,
    description: 'Eliminar Banner ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Prohibido.' })
  @ApiBadRequestResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @ApiNotFoundResponse({ description: 'El Banner que desea eliminar no existe' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async deleteBanner(@Param('id', ParseUUIDPipe) id: string): Promise<BannerDeletionResult> {
    return this.getService().deleteBanner(id)
  }

  @Patch('/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    status: 201,
    description: 'El registro ha sido actualizado exitosamente.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Prohibido.' })
  @ApiNotFoundResponse({ status: 404, description: 'No encontrado.' })
  @ApiBadRequestResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @ApiNoContentResponse({ description: 'Banner actualizado' })
  @ApiNotFoundResponse({ description: 'El Banner que desea actualizar no existe' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async updateBanner(
    @UploadedFile() file: Express.Multer.File,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBanner: UpdateBannerDto,
    @GetUser() user: User,
  ): Promise<BannerUpdateResult> {
    return this.getService().updateBanner(file, id, updateBanner, user.id)
  }
}
