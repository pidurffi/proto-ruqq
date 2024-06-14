import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { extname } from 'path'
// TODO: Averiguar la diferencia entre fs y fs/promises
import { writeFile } from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'

import { EploggerService } from '../services'
import { UploadsHandleEntity } from './uploads-handle.interface'
import { UploadsConfigService } from './uploads-handle.config'

@Injectable()
export class UploadsHandleService {
  constructor(
    @Inject(UploadsConfigService)
    private readonly configService: UploadsConfigService,
    protected readonly logger: EploggerService,
  ) {}

  async handleUpload(file: Express.Multer.File, entity: UploadsHandleEntity): Promise<string> {
    const config = this.configService.getUploadsHandleConfig(entity)
    // TODO: Seguir validando cosas del archivo
    const {
      uploadsPath,
      fileType,
      minWidth,
      minHeight,
      maxWidth,
      maxFileSize,
      allowedExtensions,
      thumbsWidth,
      thumbsFolder,
    } = config

    if (!file) {
      throw new BadRequestException('Hubo un error al subir el archivo. Inténtalo de nuevo.')
    }

    // Valida el tamaño del archivo.
    if (file.size > maxFileSize) {
      throw new BadRequestException(`El tamaño máximo del archivo debe ser ${maxFileSize} MB. `)
    }

    if (file.mimetype.startsWith('image/')) {
    } else {
      throw new BadRequestException('El archivo subido no es una imagen')
    }
    const image = sharp(file.buffer)
    const metadata: sharp.Metadata = await image.metadata()
    const { width, height } = metadata
    // Inicializa un mensaje de error vacío.
    let errorMessage = ''
    // Valida el ancho de la imagen.
    if (minWidth && width && width < minWidth) {
      errorMessage += `El ancho de la imagen debe ser de al menos ${minWidth}px. `
    }

    // Valida la altura de la imagen.
    if (minHeight && height && height < minHeight) {
      errorMessage += `La altura de la imagen debe ser de al menos ${minHeight}px. `
    }
    // Si hay algún mensaje de error, lanza una excepción con el mensaje acumulado.
    if (errorMessage) {
      throw new BadRequestException(errorMessage)
    }

    const uuidName = uuidv4()
    const fileName = `${uuidName}_${width}-${height ?? 0}${extname(file.originalname)}`
    const thumbHeight = Math.round((thumbsWidth ?? 0) * ((height ?? 0) / (width ?? 1)) ?? 1)

    const thumbName = `${uuidName}_${thumbsWidth}-${thumbHeight}${extname(file.originalname)}`
    const filePath = `${uploadsPath}/${entity.toLocaleLowerCase()}/${fileName}`

    await image.resize(thumbsWidth).toFile(`.${uploadsPath}/${entity.toLocaleLowerCase()}/${thumbsFolder}/${thumbName}`)

    await writeFile(`.${filePath}`, file.buffer)

    return `/${entity.toLocaleLowerCase()}/${fileName}`
  }
}
