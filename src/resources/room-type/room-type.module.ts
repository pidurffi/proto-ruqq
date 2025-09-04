import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { RoomTypeController } from './controllers/room-type.controller'
import { RoomTypeRepository } from './repositories/room-type.repository'
import { RoomTypeService } from './services/room-type.service'
import { RoomTypeTenantProviders } from './providers/room-type-tenant.providers'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  providers: [...RoomTypeTenantProviders, RoomTypeRepository, RoomTypeService],
  controllers: [RoomTypeController],
  exports: [RoomTypeService, RoomTypeRepository],
})
export class RoomTypeModule {}
