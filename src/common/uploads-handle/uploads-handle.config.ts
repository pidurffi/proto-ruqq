// upload-handle.config.ts
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { UploadsHandleConfig, UploadsHandleEntity } from './uploads-handle.interface'

@Injectable()
export class UploadsConfigService {
  constructor(private configService: ConfigService) {}

  getUploadsHandleConfig(entity: UploadsHandleEntity): UploadsHandleConfig {
    const uploadsPath = this.configService.get<string>('STATIC_UPLOADS_PATH')
    const servePath = this.configService.get<string>('STATIC_SERVE_ROOT')
    const fileType = this.configService.get<string>(`${entity}_FILE_TYPE`)
    const minWidth = Number(this.configService.get<string>(`${entity}_IMG_MIN_WIDTH`))
    const minHeight = Number(this.configService.get<string>(`${entity}_IMG_MIN_HEIGHT`))
    const maxWidth = Number(this.configService.get<string>(`${entity}_IMG_MAX_WIDTH`))
    const maxFileSize = Number(this.configService.get<string>(`${entity}_FILE_MAX_SIZE`)) * 1024 * 1024
    const allowedExtensions = this.configService.get<string>(`${entity}_IMG_ALLOWED_EXTENSIONS`)?.split(',')
    const thumbsWidth = Number(this.configService.get<string>(`IMG_THUMBS_WIDTH`))
    const thumbsFolder = this.configService.get<string>(`IMG_THUMBS_FOLDER`)

    if (
      !thumbsWidth ||
      !thumbsFolder ||
      !servePath ||
      !uploadsPath ||
      !fileType ||
      isNaN(maxFileSize) ||
      isNaN(minWidth) ||
      isNaN(minHeight)
    ) {
      throw new Error(`La configuración de subida de archivos no está completa para la entidad: ${entity}`)
    }

    return {
      uploadsPath,
      servePath,
      fileType,
      minWidth,
      minHeight,
      maxWidth,
      maxFileSize,
      allowedExtensions,
      thumbsWidth,
      thumbsFolder,
    }
  }
}
