import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { unlink } from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'
import { glob } from 'glob'
import { ConfigService } from '@nestjs/config'

import { EploggerService } from '../services'
import { UploadsHandleEntity, UploadsHandleReturn } from './uploads-handle.interface'
import { UploadsConfigService } from './uploads-handle.config'

// Constantes para la configuración de imágenes
const FILE_EXTENSION = '.webp'
const WEBP_QUALITY = 80
const THUMB_QUALITY = 95

/**
 * Servicio para manejar la subida y eliminación de archivos de imagen.
 */
@Injectable()
export class UploadsHandleService {
  constructor(
    @Inject(UploadsConfigService)
    private readonly uploadsConfigService: UploadsConfigService,
    private readonly logger: EploggerService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Promesa para buscar archivos que coincidan con un patrón.
   * @param pattern - Patrón de búsqueda para glob.
   * @returns Promise con un array de rutas de archivo.
   */
  private async globPromise(pattern: string): Promise<string[]> {
    return glob(pattern, {
      nodir: true,
      absolute: true,
    })
  }

  /**
   * Elimina un archivo de imagen y sus variantes.
   * @param imgPath - Ruta de la imagen a eliminar.
   * @throws {BadRequestException} Si hay un error al borrar los archivos.
   */
  async deleteFile(imgPath: string): Promise<void> {
    const uploadsConfig = this.configService.get('uploads')
    const uploadsPath: string | undefined = uploadsConfig?.general?.staticUploadsPath

    if (!uploadsPath) {
      throw new BadRequestException('La ruta de subida no está configurada')
    }

    const [entity, fileName] = imgPath.split('/')
    const [uuidPart] = fileName.split('_')

    const pattern = `${uploadsPath}/${entity}/${uuidPart}*.*`

    try {
      const files = await this.globPromise(pattern)
      await Promise.all(files.map(file => unlink(file)))
    } catch (error) {
      // this.logger.error(`Error deleting files: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException('Hubo un error al borrar los archivos')
    }
  }

  /**
   * Valida un archivo de imagen.
   * @param file - Archivo a validar.
   * @param maxFileSize - Tamaño máximo permitido en bytes.
   * @throws {BadRequestException} Si el archivo no cumple con los requisitos.
   */
  private validateFile(file: Express.Multer.File, maxFileSize: number): void {
    if (!file) {
      throw new BadRequestException('Hubo un error al subir el archivo. Inténtalo de nuevo.')
    }
    if (file.size > maxFileSize) {
      throw new BadRequestException(`El tamaño máximo del archivo debe ser ${maxFileSize / 1048576} MB.`)
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('El archivo subido no es una imagen')
    }
  }

  /**
   * Valida las dimensiones de una imagen.
   * @param width - Ancho de la imagen.
   * @param height - Altura de la imagen.
   * @param minWidth - Ancho mínimo permitido.
   * @param minHeight - Altura mínima permitida.
   * @throws {BadRequestException} Si las dimensiones no cumplen con los requisitos mínimos.
   */
  private validateDimensions(width: number, height: number, minWidth?: number, minHeight?: number): void {
    const errors: string[] = []
    if (minWidth && width < minWidth) {
      errors.push(`El ancho de la imagen debe ser de al menos ${minWidth}px.`)
    }
    if (minHeight && height < minHeight) {
      errors.push(`La altura de la imagen debe ser de al menos ${minHeight}px.`)
    }
    if (errors.length > 0) {
      throw new BadRequestException(errors.join(' '))
    }
  }

  /**
   * Calcula las nuevas dimensiones de una imagen respetando la relación de aspecto.
   * @param width - Ancho original.
   * @param height - Altura original.
   * @param maxWidth - Ancho máximo permitido.
   * @param maxHeight - Altura máxima permitida.
   * @returns Tupla con las nuevas dimensiones [ancho, alto].
   */
  private calculateNewDimensions(width: number, height: number, maxWidth: number, maxHeight: number): [number, number] {
    const aspectRatio = width / height
    if (width > maxWidth) {
      return [maxWidth, Math.round(maxWidth / aspectRatio)]
    }
    if (height > maxHeight) {
      return [Math.round(maxHeight * aspectRatio), maxHeight]
    }
    return [width, height]
  }

  /**
   * Maneja la subida de un archivo de imagen, lo procesa y crea una miniatura.
   * @param file - Archivo de imagen a subir.
   * @param entity - Entidad asociada a la imagen.
   * @returns Promise con la información de los archivos subidos.
   * @throws {BadRequestException} Si hay un error en el proceso de subida o procesamiento.
   */
  async handleUpload(file: Express.Multer.File, entity: UploadsHandleEntity): Promise<UploadsHandleReturn> {
    const config = this.uploadsConfigService.getUploadsHandleConfig(entity)
    const { uploadsPath, maxFileSize, minWidth, minHeight, thumbsWidth, maxWidth, maxHeight } = config

    this.validateFile(file, maxFileSize)

    const image = sharp(file.buffer).rotate()
    const metadata = await image.metadata()

    // Manejo de la orientación de la imagen
    const [width, height] =
      metadata.orientation && metadata.orientation > 4
        ? [metadata.height ?? 0, metadata.width ?? 0]
        : [metadata.width ?? 0, metadata.height ?? 0]

    this.validateDimensions(width, height, minWidth, minHeight)

    const [newWidth, newHeight] = this.calculateNewDimensions(width, height, maxWidth, maxHeight)
    const thumbHeight = Math.round((thumbsWidth * height) / width)

    const uuidName = uuidv4()
    const fileName = `${uuidName}_${newWidth}-${newHeight}${FILE_EXTENSION}`
    const thumbName = `${uuidName}_${thumbsWidth}-${thumbHeight}${FILE_EXTENSION}`

    const entityPath = `${uploadsPath}/${entity.toLowerCase()}`
    const filePath = `/${entityPath}/${fileName}`
    const thumbPath = `/${entityPath}/${thumbName}`

    try {
      // Procesamiento paralelo de la imagen original y la miniatura
      await Promise.all([
        image.resize(newWidth, newHeight).webp({ quality: WEBP_QUALITY }).toFile(`.${filePath}`),
        image.resize(thumbsWidth, thumbHeight).webp({ quality: THUMB_QUALITY }).toFile(`.${thumbPath}`),
      ])
    } catch (error) {
      // this.logger.error(`Error processing image: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException('Hubo un error al procesar la imagen')
    }

    return {
      fileUploaded: `${entity.toLowerCase()}/${fileName}`,
      thumbUploaded: `${entity.toLowerCase()}/${thumbName}`,
    }
  }
}
