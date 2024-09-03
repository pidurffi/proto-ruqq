import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { HotelServiceController } from './controllers/hotel-service.controller'
import { HotelServiceRepository } from './repositories/hotel-service.repository'
import { HotelServiceService } from './services/hotel-service.service'
import { HotelServiceProviders } from './providers/hotel-service.providers'
import { HotelModule } from '../hotel/hotel.module'
import { ServiceModule } from '../service/service.module'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule, HotelModule, ServiceModule],
  providers: [...HotelServiceProviders, HotelServiceRepository, HotelServiceService, HotelServiceRepository],
  controllers: [HotelServiceController],
  exports: [HotelServiceService],
})
export class HotelServiceModule {}
