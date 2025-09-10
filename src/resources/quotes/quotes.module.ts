import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { QuotesController } from './controllers/quotes.controller'
import { QuoteEngineService } from './services/quote-engine.service'  // ← Nuevo servicio limpio
import { QuotesService } from './services/quotes.service'  // ← Servicio con generación de templates
import { DailyRoomRatesModule } from '../daily-room-rates/daily-room-rates.module'  // ← Módulo OTA
import { RoomTypeModule } from '../room-type/room-type.module'  // ← Para tenant-aware room types
import { QuoteTemplateModule } from '../quote-template/quote-template.module'  // ← Para templates
import { ContentBlockModule } from '../content-block/content-block.module'  // ← Para content blocks

@Module({
  imports: [
    ConfigModule, 
    DatabaseModule, 
    CommonModule, 
    AuthModule,
    DailyRoomRatesModule,  // ← Acceso a daily rates tenant-aware
    RoomTypeModule,  // ← Acceso tenant-aware a room types
    QuoteTemplateModule,  // ← Para templates
    ContentBlockModule  // ← Para content blocks
  ],
  providers: [QuoteEngineService, QuotesService],
  controllers: [QuotesController],
  exports: [QuoteEngineService, QuotesService],
})
export class QuotesModule {}
