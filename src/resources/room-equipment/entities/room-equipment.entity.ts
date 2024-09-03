import { Entity, ManyToOne, Index } from 'typeorm'

import { EntityBase } from '../../../common/entities/base.entity'
import { Room } from '../../room/entities/room.entity'
import { Equipment } from '../../equipment/entities/equipment.entity'

@Entity({ name: 'room_equipment' })
@Index(['room', 'equipment'], { unique: true })
export class RoomEquipment extends EntityBase {
  @ManyToOne(() => Room, room => room.roomEquipments, { onDelete: 'CASCADE' })
  room: Room

  @ManyToOne(() => Equipment, equipment => equipment.roomEquipments, { onDelete: 'CASCADE' })
  equipment: Equipment
}
