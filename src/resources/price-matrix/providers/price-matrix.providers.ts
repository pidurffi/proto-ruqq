import { DataSource } from 'typeorm'

import { resources } from '../../../engine/database/constants'

// Note: Price Matrix no requiere una entidad propia ya que utiliza 
// los repositorios existentes (BaseRatePeriodRepository, PriceRulesService)
// Este archivo se mantiene para seguir la estructura estándar del proyecto
// y facilitar futuras extensiones

export const PriceMatrixProviders = [
  // Actualmente vacío - el servicio usa repositorios ya existentes
  // Futuras extensiones podrían agregar providers específicos para:
  // - PromotionsRepository
  // - PriceMatrixCacheService  
  // - PriceMatrixAuditService
]