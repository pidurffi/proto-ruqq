import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { ConfigService } from '@nestjs/config'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { Hotel } from '../entities/hotel.entity'
import { baseErrors, EploggerService } from '../../../common'
import { resources } from '../../../engine/database/constants'
import { HotelRepository } from '../repositories/hotel.repository'
import { UpdateHotelDto } from '../dto/hotel.dto'
import { HotelConfig } from '../interfaces/hotel.interface'
import { UploadsHandleService } from '../../../common/uploads-handle/uploads-handle.service'
import { UploadsHandleEntity } from '../../../common/uploads-handle/uploads-handle.interface'

@Injectable()
export class HotelService extends BaseEntityService<Hotel> {
  private context = 'Hotel'

  constructor(
    @Inject(HotelRepository)
    private readonly repository: HotelRepository,
    private configService: ConfigService,

    protected readonly logger: EploggerService,
    protected readonly uploadsHandleService: UploadsHandleService,

    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super(logger)
  }

  protected getRepository(): HotelRepository {
    return this.repository
  }

  async updateHotel(file: Express.Multer.File, id: string, updateHotelDto: UpdateHotelDto, uid: string) {
    const hotel = await this.getRepository().preload({
      id,
      ...updateHotelDto,
    })
    if (!hotel) {
      throw new BadRequestException(`No se encontró el hotel con id ${id}`)
    }

    if (file) {
      // Si existe una imagen anterior, eliminarla
      if (hotel.imgCoverPath) {
        await this.uploadsHandleService.deleteFile(hotel.imgCoverPath)
      }
      const fileUploaded = await this.uploadsHandleService.handleUpload(file, UploadsHandleEntity.HOTEL)
      hotel.imgCoverPath = fileUploaded.fileUploaded
      hotel.imgCoverThumbPath = fileUploaded.thumbUploaded
    }

    hotel.uid = uid

    try {
      // Usar save() en lugar de create() para actualizar
      const roomUpdated = await this.getRepository().save(hotel)

      // 5) Mapear el objeto
      return {
        roomUpdated, // Considera mapear esto a un DTO específico si es necesario
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Delegar otros errores al manejador de errores general
      this.handleErrors(error, this.context, false, [baseErrors.DUPLICATE_ENTRY])
    }
  }

  async getHotel() {
    const servePath = this.configService.get<string>('STATIC_SERVE_ROOT')

    const hotelData = await this.getRepository().getHotel()

    // Extraemos el hotel del objeto '0'
    const hotel = hotelData['0']

    return {
      ...hotel,
      imgCoverPath: `${servePath}/${hotel.imgCoverPath}`,
      imgCoverThumbPath: `${servePath}/${hotel.imgCoverThumbPath}`,
      hotelImgs: hotel.hotelImgs.map(img => ({
        ...img,
        imgPath: `${servePath}/${img.imgPath}`,
        imgThumbPath: `${servePath}/${img.imgThumbPath}`,
      })),
      hotelServices: hotel.hotelServices.map(service => ({
        name: service.service.name,
        slug: service.service.slug,
      })),
    }
  }

  async getSections(): Promise<HotelConfig> {
    const hotelSections: HotelConfig | undefined = this.configService.get<HotelConfig>('hotel-sections')

    if (!hotelSections) {
      throw new Error('Hotel sections configuration not found')
    }

    return hotelSections
  }
}
