import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { unlink } from 'fs/promises'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { HotelImg } from '../entities/hotel-img.entity'
import { EploggerService } from '../../../common'
import { resources } from '../../../engine/database/constants'
import { HotelImgRepository } from '../repositories/hotel-img.repository'
import { HotelImgDto, HotelImgQueryDto } from '../dto/hotel-img.dto'
import { UploadsHandleService } from '../../../common/uploads-handle/uploads-handle.service'
import { HotelService } from '../../hotel/services/hotel.service'
import { UploadsHandleEntity } from '../../../common/uploads-handle/uploads-handle.interface'

@Injectable()
export class HotelImgService extends BaseEntityService<HotelImg> {
  constructor(
    @Inject(HotelImgRepository)
    private readonly repository: HotelImgRepository,
    protected readonly uploadsHandleService: UploadsHandleService,
    private readonly hotelService: HotelService,
    protected readonly logger: EploggerService,

    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super(logger)
  }

  protected getRepository(): HotelImgRepository {
    return this.repository
  }

  async createImgsHotel(hotelImgDto: HotelImgDto, uid: string, files: Express.Multer.File[]) {
    // Verifica que exista la habitación
    const hotel = await this.hotelService.findByIdOrFail('00000000-0000-0000-0000-000000000000')
    if (!hotel) {
      throw new BadRequestException('Hotel no encontrada')
    }

    const filesUploaded: { fileUploaded: string; thumbUploaded: string }[] = []
    for (const file of files) {
      const uploadedFiles = await this.uploadsHandleService.handleUpload(file, UploadsHandleEntity.HOTEL_IMG)
      filesUploaded.push(uploadedFiles)
    }

    // 2. Crear los registros en la entidad hotel-img
    try {
      const hotelImgEntities = filesUploaded.map(uploadedFile => ({
        imgPath: uploadedFile.fileUploaded,
        imgThumbPath: uploadedFile.thumbUploaded,
        hotel: hotel,
        uid,
        // Agregar aquí otros campos si es necesario
      }))

      for (const hotelImgEntity of hotelImgEntities) {
        await this.create(hotelImgEntity)
      }

      return filesUploaded // Retorna las entidades creadas o un mensaje de éxito
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Si hay un error, eliminar los archivos subidos
      for (const uploadedFile of filesUploaded) {
        await unlink(uploadedFile.fileUploaded)
        await unlink(uploadedFile.thumbUploaded)
      }
      throw new BadRequestException(`Error al crear las imágenes de la habitación: ${error.message}`)
    }
  }

  async findAllWithFilterPaginated(payload: HotelImgQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }
}
