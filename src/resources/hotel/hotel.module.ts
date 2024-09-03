import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { HotelController } from './controllers/hotel.controller'
import { HotelRepository } from './repositories/hotel.repository'
import { HotelService } from './services/hotel.service'
import { HotelProviders } from './providers/hotel.providers'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  providers: [...HotelProviders, HotelRepository, HotelService, HotelRepository],
  controllers: [HotelController],
  exports: [HotelService],
})
export class HotelModule {}
