import { Module } from '@nestjs/common'

// import { ConfigModule } from '../../config/config.module'
import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'

import { DailyRoomRatesTenantProviders } from './providers/daily-room-rates-tenant.providers'
import { DailyRoomRatesRepository } from './repositories/daily-room-rates.repository'
import { DailyRatesService } from './services/daily-room-rates.service'
import { DailyRoomRatesController } from './controllers/daily-room-rates.controller'

/**
 * DailyRoomRatesModule - Módulo completo para modelo OTA estándar
 * 
 * ARQUITECTURA MULTI-TENANT:
 * - Usa DailyRoomRatesTenantProviders para aislamiento de datos
 * - Compatible con esquemas PostgreSQL separados por hotel
 * - Intercepta todas las operaciones CRUD para aplicar contexto de tenant
 * 
 * REEMPLAZA COMPLETAMENTE:
 * ❌ BaseRatePeriodModule
 * ❌ PriceRulesModule  
 * ❌ OccupancyRateModifiersModule
 * ❌ RestrictionsModule (parcialmente)
 * 
 * BENEFICIOS:
 * ✅ Un solo módulo vs 4 módulos complejos
 * ✅ Lógica simple y directa
 * ✅ Compatible 100% con estándares OTA
 * ✅ Performance optimizada para escala
 */
@Module({
  imports: [
    // ConfigModule,
    DatabaseModule,
    CommonModule,
    AuthModule
  ],
  providers: [
    ...DailyRoomRatesTenantProviders,
    DailyRoomRatesRepository,
    DailyRatesService,
  ],
  controllers: [
    DailyRoomRatesController
  ],
  exports: [
    DailyRatesService,
    DailyRoomRatesRepository,
  ],
})
export class DailyRoomRatesModule {}