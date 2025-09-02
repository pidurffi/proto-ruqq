import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { CalendarController } from './controllers/calendar.controller'
import { CalendarService } from './services/calendar.service'
import { PriceRulesModule } from '../price-rules/price-rules.module'
import { BaseRatePeriodModule } from '../base-rate-period/base-rate-period.module'

@Module({
  imports: [
    ConfigModule, 
    DatabaseModule, 
    CommonModule, 
    AuthModule,
    PriceRulesModule,
    BaseRatePeriodModule
  ],
  providers: [CalendarService],
  controllers: [CalendarController],
  exports: [CalendarService],
})
export class CalendarModule {}
