import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { RoomImgController } from './controllers/room-img.controller'
import { RoomImgRepository } from './repositories/room-img.repository'
import { RoomImgService } from './services/room-img.service'
import { RoomImgProviders } from './providers/room-img.providers'
import { RoomModule } from '../room/room.module'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule, RoomModule],
  providers: [...RoomImgProviders, RoomImgRepository, RoomImgService, RoomImgRepository],
  controllers: [RoomImgController],
  exports: [RoomImgService],
})
export class RoomImgModule {}
