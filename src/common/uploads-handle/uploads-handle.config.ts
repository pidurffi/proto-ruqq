// upload-handle.config.ts
import { BadRequestException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { UploadsHandleConfig, UploadsHandleEntity } from './uploads-handle.interface'

@Injectable()
export class UploadsConfigService {
  constructor(private configService: ConfigService) {}

  getUploadsHandleConfig(entity: UploadsHandleEntity): UploadsHandleConfig {
    // Configuración completa desde config.json
    const uploadsConfig = this.configService.get('uploads')

    if (!uploadsConfig) {
      throw new BadRequestException('No se encontró la configuración de uploads')
    }

    const generalConfig = uploadsConfig.general
    const entityConfig = uploadsConfig[entity]

    if (!generalConfig) {
      throw new BadRequestException('No se encontró la configuración general de uploads')
    }

    if (!entityConfig) {
      throw new BadRequestException(`No se encontró configuración para la entidad: ${entity}`)
    }

    const { staticUploadsPath, staticServeRoot, thumbsWidth, thumbsFolder } = generalConfig

    const { fileType, fileMaxSize, imgAllowedExtensions, imgMinWidth, imgMinHeight, imgMaxWidth, imgMaxHeight } =
      entityConfig

    // Validaciones
    if (
      !thumbsWidth ||
      !staticServeRoot ||
      !staticUploadsPath ||
      !fileType ||
      !fileMaxSize ||
      !imgMinWidth ||
      !imgMinHeight ||
      !imgMaxWidth ||
      !imgMaxHeight ||
      !imgAllowedExtensions ||
      !thumbsFolder
    ) {
      throw new BadRequestException(
        `La configuración de subida de archivos no está completa para la entidad: ${entity}`,
      )
    }

    // Convertir tamaño de archivo de MB a bytes
    const maxFileSize = Number(fileMaxSize) * 1024 * 1024

    return {
      uploadsPath: staticUploadsPath,
      servePath: staticServeRoot,
      fileType,
      minWidth: Number(imgMinWidth),
      minHeight: Number(imgMinHeight),
      maxWidth: Number(imgMaxWidth),
      maxHeight: Number(imgMaxHeight),
      maxFileSize,
      allowedExtensions: imgAllowedExtensions,
      thumbsWidth: Number(thumbsWidth),
      thumbsFolder,
    }
  }
}
