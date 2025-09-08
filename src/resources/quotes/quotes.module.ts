import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { QuotesController } from './controllers/quotes.controller'
import { QuotesService } from './services/quotes.service'  // ← Servicio actualizado
import { DailyRoomRatesModule } from '../daily-room-rates/daily-room-rates.module'  // ← Nuevo módulo OTA

@Module({
  imports: [
    ConfigModule, 
    DatabaseModule, 
    CommonModule, 
    AuthModule,
    DailyRoomRatesModule  // ← Reemplaza BaseRatePeriodModule + PriceRulesModule
  ],
  providers: [QuotesService],
  controllers: [QuotesController],
  exports: [QuotesService],
})
export class QuotesModule {}
