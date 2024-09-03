import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { RoomEquipmentController } from './controllers/room-equipment.controller'
import { RoomEquipmentRepository } from './repositories/room-equipment.repository'
import { RoomEquipmentService } from './services/room-equipment.service'
import { RoomEquipmentProviders } from './providers/room-equipment.providers'
import { RoomModule } from '../room/room.module'
import { EquipmentModule } from '../equipment/equipment.module'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule, RoomModule, EquipmentModule],
  providers: [...RoomEquipmentProviders, RoomEquipmentRepository, RoomEquipmentService, RoomEquipmentRepository],
  controllers: [RoomEquipmentController],
  exports: [RoomEquipmentService],
})
export class RoomEquipmentModule {}
