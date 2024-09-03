import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { unlink } from 'fs/promises'
import { ConfigService } from '@nestjs/config'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { Banner } from '../entities/banner.entity'
import { baseErrors, EploggerService } from '../../../common'
import { resources } from '../../../engine/database/constants'
import { BannerRepository } from '../repositories/banner.repository'
import { BannerDto, BannerQueryDto, UpdateBannerDto } from '../dto/banner.dto'
import { UploadsHandleService } from '../../../common/uploads-handle/uploads-handle.service'
import { UploadsHandleEntity } from '../../../common/uploads-handle/uploads-handle.interface'
import { User } from '../../../engine/auth'
import {
  ProcessedBanner,
  BannerCreationResult,
  BannerDeletionResult,
  BannerUpdateResult,
} from '../interfaces/banner.interface'

@Injectable()
export class BannerService extends BaseEntityService<Banner> {
  private context = 'banner'
  constructor(
    @Inject(BannerRepository)
    private readonly repository: BannerRepository,
    protected readonly configService: ConfigService,
    protected readonly logger: EploggerService,
    protected readonly uploadsHandleService: UploadsHandleService,

    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super(logger)
  }

  protected getRepository(): BannerRepository {
    return this.repository
  }

  async findAllWithFilterPaginated(payload: BannerQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }

  // TODO: BORRAR ESTO y aplicar el diagrama de Herni
  async updateBannerImagePath(bannerId: string, imagePath: string): Promise<Banner> {
    const banner = await this.repository.findOneBy({ id: bannerId })
    if (!banner) {
      throw new Error('Banner not found')
    }
    banner.imgPath = imagePath
    return this.repository.save(banner)
  }

  async getAllBanners(): Promise<ProcessedBanner[]> {
    const banners = await this.getRepository().getAllBanners()
    const servePath = this.configService.get<string>('STATIC_SERVE_ROOT')

    if (!servePath) {
      throw new Error('STATIC_SERVE_ROOT no está configurado')
    }

    return banners.map(banner => ({
      ...banner,
      imgPath: `${servePath}/${banner.imgPath}`,
      thumbPath: `${servePath}/${banner.thumbPath}`,
    }))
  }

  async getBannerById(id: string): Promise<ProcessedBanner> {
    const banner = await this.getRepository().getBannerById(id)
    if (!banner) {
      throw new BadRequestException(`No se encontró el banner con id ${id}`)
    }
    return this.processBanner(banner)
  }

  private processBanner(banner: Banner): ProcessedBanner {
    const servePath = this.configService.get<string>('STATIC_SERVE_ROOT')

    if (!servePath) {
      throw new Error('STATIC_SERVE_ROOT no está configurado')
    }

    return {
      ...banner,
      imgPath: `${servePath}/${banner.imgPath}`,
      thumbPath: `${servePath}/${banner.thumbPath}`,
    }
  }

  async getPromotionsByFilter(cant: number): Promise<ProcessedBanner[]> {
    const banners = await this.getRepository().getBannersByFilter(cant)
    const servePath = this.configService.get<string>('STATIC_SERVE_ROOT')

    if (!servePath) {
      throw new Error('STATIC_SERVE_ROOT no está configurado')
    }

    return banners.map(banner => ({
      ...banner,
      imgPath: `${servePath}/${banner.imgPath}`,
      thumbPath: `${servePath}/${banner.thumbPath}`,
    }))
  }

  async createBanner(file: Express.Multer.File, bannerDto: BannerDto, user: User): Promise<BannerCreationResult> {
    const uploaded = await this.uploadsHandleService.handleUpload(file, UploadsHandleEntity.BANNER)
    const uploadsPath = this.configService.get<string>('STATIC_UPLOADS_PATH')

    if (!uploadsPath) {
      throw new Error('STATIC_UPLOADS_PATH no está configurado')
    }

    try {
      const banner = await this.create({
        ...bannerDto,
        uid: user.id,
        imgPath: uploaded.fileUploaded,
        thumbPath: uploaded.thumbUploaded,
      })

      return {
        id: banner.id,
        title: banner.title,
        description: banner.description,
        imgPath: banner.imgPath,
        thumbPath: banner.thumbPath,
      }
    } catch (error: unknown) {
      await Promise.all([
        unlink(`${uploadsPath}/${uploaded.fileUploaded}`),
        unlink(`${uploadsPath}/${uploaded.thumbUploaded}`),
      ])

      if (error instanceof Error && 'code' in error && error.code === '23505') {
        throw new BadRequestException(`Una banner con título '${bannerDto.title}' ya existe.`)
      }

      this.handleErrors(error, this.context, false, [baseErrors.DUPLICATE_ENTRY])
      throw error
    }
  }

  async updateBanner(
    file: Express.Multer.File | undefined,
    id: string,
    updateBannerDto: UpdateBannerDto,
    uid: string,
  ): Promise<BannerUpdateResult> {
    const banner = await this.getRepository().preload({
      id,
      ...updateBannerDto,
    })

    if (!banner) {
      throw new BadRequestException(`No se encontró el banner con id ${id}`)
    }

    if (file) {
      if (banner.imgPath) {
        await this.uploadsHandleService.deleteFile(banner.imgPath)
      }
      const fileUploaded = await this.uploadsHandleService.handleUpload(file, UploadsHandleEntity.BANNER)
      banner.imgPath = fileUploaded.fileUploaded
      banner.thumbPath = fileUploaded.thumbUploaded
    }

    banner.uid = uid

    try {
      await this.getRepository().save(banner)
      return updateBannerDto
    } catch (error) {
      this.handleErrors(error, this.context)
      throw error
    }
  }

  async deleteBanner(id: string): Promise<BannerDeletionResult> {
    const banner = await this.findById(id)
    if (!banner) {
      throw new BadRequestException('No existe el banner con el id proporcionado')
    }

    if (banner.imgPath) {
      await this.uploadsHandleService.deleteFile(banner.imgPath)
    }

    await this.deleteHard(id)
    return { message: `Banner con ID ${id} eliminado de la base de datos` }
  }
}
