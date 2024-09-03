import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { RoomController } from './controllers/room.controller'
import { RoomRepository } from './repositories/room.repository'
import { RoomService } from './services/room.service'
import { RoomProviders } from './providers/room.providers'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  providers: [...RoomProviders, RoomRepository, RoomService, RoomRepository],
  controllers: [RoomController],
  exports: [RoomService],
})
export class RoomModule {}
