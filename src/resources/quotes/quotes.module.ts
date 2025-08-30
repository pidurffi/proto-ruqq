import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { QuotesController } from './controllers/quotes.controller'
import { QuotesService } from './services/quotes.service'
import { BaseRatePeriodModule } from '../base-rate-period/base-rate-period.module'

@Module({
  imports: [
    ConfigModule, 
    DatabaseModule, 
    CommonModule, 
    AuthModule,
    BaseRatePeriodModule
  ],
  providers: [QuotesService],
  controllers: [QuotesController],
  exports: [QuotesService],
})
export class QuotesModule {}
