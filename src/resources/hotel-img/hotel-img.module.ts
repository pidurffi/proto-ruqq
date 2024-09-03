import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { HotelImgController } from './controllers/hotel-img.controller'
import { HotelImgRepository } from './repositories/hotel-img.repository'
import { HotelImgService } from './services/hotel-img.service'
import { HotelImgProviders } from './providers/hotel-img.providers'
import { HotelModule } from '../hotel/hotel.module'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule, HotelModule],
  providers: [...HotelImgProviders, HotelImgRepository, HotelImgService, HotelImgRepository],
  controllers: [HotelImgController],
  exports: [HotelImgService],
})
export class HotelImgModule {}
