import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { CalendarController } from './controllers/calendar.controller'
import { CalendarService } from './services/calendar.service'
import { DailyRoomRatesModule } from '../daily-room-rates/daily-room-rates.module'  // ← Nuevo módulo OTA

@Module({
  imports: [
    ConfigModule, 
    DatabaseModule, 
    CommonModule, 
    AuthModule,
    DailyRoomRatesModule  // ← Reemplaza PriceRulesModule + BaseRatePeriodModule
  ],
  providers: [CalendarService],
  controllers: [CalendarController],
  exports: [CalendarService],
})
export class CalendarModule {}
