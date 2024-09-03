import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { unlink } from 'fs/promises'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { RoomImg } from '../entities/room-img.entity'
import { EploggerService } from '../../../common'
import { resources } from '../../../engine/database/constants'
import { RoomImgRepository } from '../repositories/room-img.repository'
import { RoomImgDto, RoomImgQueryDto } from '../dto/room-img.dto'
import { RoomService } from '../../room/services/room.service'
import { UploadsHandleService } from '../../../common/uploads-handle/uploads-handle.service'
import { UploadsHandleEntity } from '../../../common/uploads-handle/uploads-handle.interface'

@Injectable()
export class RoomImgService extends BaseEntityService<RoomImg> {
  constructor(
    @Inject(RoomImgRepository)
    private readonly repository: RoomImgRepository,
    protected readonly logger: EploggerService,
    protected readonly uploadsHandleService: UploadsHandleService,
    private readonly roomService: RoomService,

    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super(logger)
  }

  protected getRepository(): RoomImgRepository {
    return this.repository
  }

  async createImgsRoom(roomImgDto: RoomImgDto, uid: string, files: Express.Multer.File[]) {
    // Verifica que exista la habitación
    const room = await this.roomService.findByIdOrFail(roomImgDto.roomId)
    if (!room) {
      throw new BadRequestException('Habitación no encontrada')
    }

    const filesUploaded: { fileUploaded: string; thumbUploaded: string }[] = []
    for (const file of files) {
      const uploadedFiles = await this.uploadsHandleService.handleUpload(file, UploadsHandleEntity.ROOM_IMG)
      filesUploaded.push(uploadedFiles)
    }

    // 2. Crear los registros en la entidad room-img
    try {
      const roomImgEntities = filesUploaded.map(uploadedFile => ({
        imgPath: uploadedFile.fileUploaded,
        imgThumbPath: uploadedFile.thumbUploaded,
        room: room,
        uid,
        // Agregar aquí otros campos si es necesario
      }))

      for (const roomImgEntity of roomImgEntities) {
        await this.create(roomImgEntity)
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

  async findAllWithFilterPaginated(payload: RoomImgQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }
}
