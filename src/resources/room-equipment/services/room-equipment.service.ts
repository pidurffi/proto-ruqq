import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { RoomEquipment } from '../entities/room-equipment.entity'
import { EploggerService } from '../../../common'
import { resources } from '../../../engine/database/constants'
import { RoomEquipmentRepository } from '../repositories/room-equipment.repository'
import { RoomEquipmentDto, RoomEquipmentQueryDto } from '../dto/room-equipment.dto'
import { RoomService } from '../../room/services/room.service'
import { EquipmentService } from '../../equipment/services/equipment.service'

@Injectable()
export class RoomEquipmentService extends BaseEntityService<RoomEquipment> {
  constructor(
    @Inject(RoomEquipmentRepository)
    private readonly repository: RoomEquipmentRepository,
    private readonly roomService: RoomService,
    private readonly equipmentService: EquipmentService,

    protected readonly logger: EploggerService,

    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super(logger)
  }

  protected getRepository(): RoomEquipmentRepository {
    return this.repository
  }

  async findAllWithFilterPaginated(payload: RoomEquipmentQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }

  async createRoomEquipment(roomEquipmentDto: RoomEquipmentDto, uid: string) {
    const { roomId, equipmentIds } = roomEquipmentDto

    // 1) Verificar que la habitación exista
    const room = await this.roomService.findById(roomId)
    if (!room) {
      throw new BadRequestException('Habitación no encontrada')
    }

    // 2) Verificar que todos los equipos existan
    await Promise.all(
      equipmentIds.map(async equipmentId => {
        await this.equipmentService.findByIdOrFail(equipmentId)
      }),
    )

    // 3) Eliminar todos los registros existentes para esta habitación
    await this.getRepository().delete({ room: { id: roomId } })

    const savedRoomEquipments: RoomEquipment[] = []

    for (const equipmentId of equipmentIds) {
      try {
        const roomEquipment = this.getRepository().create({
          room: room,
          equipment: await this.equipmentService.findByIdOrFail(equipmentId),
          uid,
        })
        const savedRoomEquipment = await this.getRepository().save(roomEquipment)
        savedRoomEquipments.push(savedRoomEquipment)
      } catch (error) {
        // Ya no verificamos específicamente por errores de duplicado
        throw new BadRequestException('Error al guardar la relación')
      }
    }

    return savedRoomEquipments
  }
}
