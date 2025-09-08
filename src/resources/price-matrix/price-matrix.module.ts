import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'

import { PriceMatrixProviders } from './providers/price-matrix.providers'
import { PriceMatrixService } from './services/price-matrix.service'
import { PriceMatrixController } from './controllers/price-matrix.controller'

// Importar módulo OTA unificado
import { DailyRoomRatesModule } from '../daily-room-rates/daily-room-rates.module'  // ← Reemplaza BaseRatePeriod + PriceRules

/**
 * PriceMatrixModule - REFACTORIZADO para modelo OTA diario
 * 
 * SIMPLIFICACIÓN:
 * - ANTES: Dependía de BaseRatePeriodModule + PriceRulesModule + lógica compleja
 * - AHORA: Solo DailyRoomRatesModule (modelo OTA estándar)
 * 
 * ELIMINAMOS:
 * ❌ Dependencias múltiples y complejas
 * ❌ Lógica de capas (base + overrides)
 * ❌ Orchestración compleja entre servicios
 * 
 * NUEVA ARQUITECTURA:
 * ✅ Una sola fuente de datos: daily_room_rates
 * ✅ Compatible con APIs de OTAs
 * ✅ Simplificación masiva del código
 */
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    CommonModule,
    AuthModule,
    DailyRoomRatesModule, // ← Reemplaza BaseRatePeriodModule + PriceRulesModule
  ],
  providers: [
    ...PriceMatrixProviders,
    PriceMatrixService,
  ],
  controllers: [
    PriceMatrixController,
  ],
  exports: [
    PriceMatrixService, // Exportar por si otros módulos necesitan usar el servicio
  ],
})
export class PriceMatrixModule {}