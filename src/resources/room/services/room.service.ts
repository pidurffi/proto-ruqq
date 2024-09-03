import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import slugify from 'slugify' // Import the 'slugify' function

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { Room } from '../entities/room.entity'
import { baseErrors, EploggerService } from '../../../common'
import { resources } from '../../../engine/database/constants'
import { RoomRepository } from '../repositories/room.repository'
import { RoomDto, RoomQueryDto, RoomResponseDto, UpdateRoomDto } from '../dto/room.dto'
import { UploadsHandleService } from '../../../common/uploads-handle/uploads-handle.service'
import { UploadsHandleEntity } from '../../../common/uploads-handle/uploads-handle.interface'

@Injectable()
export class RoomService extends BaseEntityService<Room> {
  private context = 'Habitación'

  constructor(
    @Inject(RoomRepository)
    private readonly repository: RoomRepository,
    private readonly configService: ConfigService,
    protected readonly logger: EploggerService,
    protected readonly uploadsHandleService: UploadsHandleService,

    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super(logger)
  }

  protected getRepository(): RoomRepository {
    return this.repository
  }

  private generateSlug(title: string): string {
    return slugify(title, { lower: true })
  }

  async createRoom(file: Express.Multer.File, roomDto: RoomDto, uid: string): Promise<RoomResponseDto | undefined> {
    const fileUploaded = await this.uploadsHandleService.handleUpload(file, UploadsHandleEntity.ROOM)

    try {
      const room = await this.create({
        ...roomDto,
        slug: this.generateSlug(roomDto.name),
        uid,
        imgCoverPath: fileUploaded.fileUploaded,
        imgCoverThumbPath: fileUploaded.thumbUploaded,
      })

      // Aquí mapeas el objeto Room a RoomResponseDto
      return {
        id: room.id,
        name: room.name,
        shortDescription: room.shortDescription,
        fullDescription: room.fullDescription,
        slug: room.slug,
        // otros campos necesarios (Habría que agregarlos en RoomResponseDto)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Chequeo específico para el error de duplicidad
      if (error.code === '23505') {
        throw new BadRequestException(`Una habitación con el nombre '${roomDto.name}' ya existe.`)
      }

      // Delegar otros errores al manejador de errores general
      this.handleErrors(error, this.context, false, [baseErrors.DUPLICATE_ENTRY])
    }
  }

  async updateRoom(file: Express.Multer.File, id: string, updateRoomDto: UpdateRoomDto, uid: string) {
    // 1) Buscar la habitación por ID, si no existe, lanzar una excepción
    const room = await this.getRepository().preload({
      id,
      ...updateRoomDto,
    })
    if (!room) {
      throw new BadRequestException(`No se encontró la habitación con id ${id}`)
    }

    // 2) Actualizar el slug si se cambió el nombre
    if (updateRoomDto.name) {
      room.slug = this.generateSlug(updateRoomDto.name)
    }

    // 3) Si se subió un archivo, manejar la subida y actualizar el campo imgCoverPath
    if (file) {
      // Si existe una imagen anterior, eliminarla
      if (room.imgCoverPath) {
        await this.uploadsHandleService.deleteFile(room.imgCoverPath)
      }
      const fileUploaded = await this.uploadsHandleService.handleUpload(file, UploadsHandleEntity.ROOM)
      room.imgCoverPath = fileUploaded.fileUploaded
      room.imgCoverThumbPath = fileUploaded.thumbUploaded
    }

    // 4) Actualizar el uid
    room.uid = uid

    try {
      // Usar save() en lugar de create() para actualizar
      const roomUpdated = await this.getRepository().save(room)

      // 5) Mapear el objeto Room a RoomResponseDto
      return {
        roomUpdated, // Considera mapear esto a un DTO específico si es necesario
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Delegar otros errores al manejador de errores general
      this.handleErrors(error, this.context, false, [baseErrors.DUPLICATE_ENTRY])
    }
  }

  async findAllWithFilterPaginated(payload: RoomQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }

  async getAllRooms() {
    const rooms = await this.getRepository().getAllRooms()
    const servePath = this.configService.get<string>('STATIC_SERVE_ROOT')

    if (!rooms || (Array.isArray(rooms) && rooms.length === 0)) {
      return { message: 'No se encontraron habitaciones' }
    }

    const processRoom = (room: Room) => ({
      ...room,
      imgCoverPath: `${servePath}/${room.imgCoverPath}`,
      imgCoverThumbPath: `${servePath}/${room.imgCoverThumbPath}`,
      roomImgs: room.roomImgs.map(roomImg => ({
        id: roomImg.id,
        imgPath: `${servePath}/${roomImg.imgPath}`,
        imgThumbPath: `${servePath}/${roomImg.imgThumbPath}`,
      })),
      roomEquipments: room.roomEquipments.map(roomEquipment => ({
        name: roomEquipment.equipment.name,
        slug: roomEquipment.equipment.slug,
      })),
    })

    if (Array.isArray(rooms)) {
      return rooms.map(processRoom)
    } else {
      return processRoom(rooms)
    }
  }

  async getRoomById(id: string) {
    const room = await this.getRepository().getRoomById(id)
    const servePath = this.configService.get<string>('STATIC_SERVE_ROOT')

    if (!room) {
      throw new BadRequestException(`No se encontró la habitación con ID ${id}`)
    }

    // Procesar la habitación devuelta directamente
    const processedRoom = {
      ...room,
      imgCoverPath: `${servePath}/${room.imgCoverPath}`,
      imgCoverThumbPath: `${servePath}/${room.imgCoverThumbPath}`,
      roomImgs: room.roomImgs.map(roomImg => ({
        id: roomImg.id,
        imgPath: `${servePath}/${roomImg.imgPath}`,
        imgThumbPath: `${servePath}/${roomImg.imgThumbPath}`,
      })),
      roomEquipments: room.roomEquipments.map(roomEquipment => ({
        name: roomEquipment.equipment.name,
        slug: roomEquipment.equipment.slug,
      })),
    }

    return processedRoom
  }

  async deleteRoom(id: string) {
    // 1) Buscar la habitación por ID, si no existe, lanzar una excepción
    const [room] = await this.findAll({
      where: { id },
      relations: ['roomImgs'],
    })

    if (!room) {
      throw new BadRequestException('No existe la habitación con el id proporcionado')
    }

    // 2) Si existe una imagen de portada (coverImage), eliminarla
    if (room.imgCoverPath) {
      await this.uploadsHandleService.deleteFile(room.imgCoverPath)
    }

    for (const img of room.roomImgs) {
      await this.uploadsHandleService.deleteFile(img.imgPath)
    }

    // 4) Elimina el registro de la base de datos
    await this.deleteHard(id)

    return { message: `Habitación con ID ${id} eliminado de la base de datos` }
  }
}
