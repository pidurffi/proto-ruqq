import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { EquipmentController } from './controllers/equipment.controller'
import { EquipmentRepository } from './repositories/equipment.repository'
import { EquipmentService } from './services/equipment.service'
import { EquipmentProviders } from './providers/equipment.providers'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  providers: [...EquipmentProviders, EquipmentRepository, EquipmentService, EquipmentRepository],
  controllers: [EquipmentController],
  exports: [EquipmentService],
})
export class EquipmentModule {}
