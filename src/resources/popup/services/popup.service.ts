import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { ConfigService } from '@nestjs/config'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { Popup } from '../entities/popup.entity'
import { baseErrors, EploggerService } from '../../../common'
import { resources } from '../../../engine/database/constants'
import { PopupRepository } from '../repositories/popup.repository'
import { PopupQueryDto, UpdatePopupDto } from '../dto/popup.dto'
import { UploadsHandleService } from '../../../common/uploads-handle/uploads-handle.service'
import { UploadsHandleEntity } from '../../../common/uploads-handle/uploads-handle.interface'

@Injectable()
export class PopupService extends BaseEntityService<Popup> {
  private context = 'PopupService'
  constructor(
    @Inject(PopupRepository)
    private readonly repository: PopupRepository,
    private configService: ConfigService,

    protected readonly logger: EploggerService,
    protected readonly uploadsHandleService: UploadsHandleService,

    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super(logger)
  }

  protected getRepository(): PopupRepository {
    return this.repository
  }

  async updatePopup(file: Express.Multer.File, id: string, updatePopupDto: UpdatePopupDto, uid: string) {
    const popup = await this.getRepository().preload({
      id,
      ...updatePopupDto,
    })
    if (!popup) {
      throw new BadRequestException('No se encontró el registro a actualizar')
    }

    if (file) {
      // Si existe una imagen anterior, eliminarla
      if (popup.imgPath) {
        await this.uploadsHandleService.deleteFile(popup.imgPath)
      }
      const fileUploaded = await this.uploadsHandleService.handleUpload(file, UploadsHandleEntity.POPUP)
      popup.imgPath = fileUploaded.fileUploaded
      popup.imgThumbPath = fileUploaded.thumbUploaded
    }

    popup.uid = uid

    try {
      // Usar save() en lugar de create() para actualizar
      const popupUpdated = await this.getRepository().save(popup)

      // 5) Mapear el objeto
      return {
        popupUpdated, // Considera mapear esto a un DTO específico si es necesario
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Delegar otros errores al manejador de errores general
      this.handleErrors(error, this.context, false, [baseErrors.DUPLICATE_ENTRY])
    }
  }
  async getPopup() {
    const servePath = this.configService.get<string>('STATIC_SERVE_ROOT')

    const popupData = await this.getRepository().getPopup()
    const popup = popupData[0]

    return {
      ...popup,
      imgPath: `${servePath}/${popup.imgPath}`,
      imgThumbPath: `${servePath}/${popup.imgThumbPath}`,
    }
  }

  async findAllWithFilterPaginated(payload: PopupQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }
}
