import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'

import { PriceMatrixProviders } from './providers/price-matrix.providers'
import { PriceMatrixService } from './services/price-matrix.service'
import { PriceMatrixController } from './controllers/price-matrix.controller'

// Importar módulos de dependencias requeridas
import { BaseRatePeriodModule } from '../base-rate-period/base-rate-period.module'
import { PriceRulesModule } from '../price-rules/price-rules.module'

/**
 * PriceMatrixModule - Módulo para funcionalidad de matriz de precios
 * 
 * RESPONSABILIDADES:
 * - Registrar y configurar componentes del módulo PriceMatrix
 * - Gestionar dependencias con otros módulos (BaseRatePeriod, PriceRules)
 * - Exponer servicio para uso en otros módulos si es necesario
 * 
 * ARQUITECTURA MODULAR:
 * - Sigue el patrón estándar de módulos NestJS del proyecto
 * - Importa módulos de dependencias para usar sus servicios y repositorios
 * - NO usa TypeOrmModule.forFeature() siguiendo las convenciones del boilerplate
 * 
 * DEPENDENCIES:
 * - BaseRatePeriodModule: Para acceder a BaseRatePeriodRepository
 * - PriceRulesModule: Para acceder a PriceRulesService
 * - AuthModule: Para autenticación y autorización
 */
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    CommonModule,
    AuthModule,
    BaseRatePeriodModule, // Importar para usar BaseRatePeriodRepository
    PriceRulesModule,     // Importar para usar PriceRulesService
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