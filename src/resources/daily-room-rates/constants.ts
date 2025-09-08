export const repositories = {
  DAILY_ROOM_RATES_REPOSITORY: 'DAILY_ROOM_RATES_REPOSITORY',
}

/**
 * Fuentes de pricing - Para tracking y auditoría
 */
export enum PricingSource {
  MANUAL = 'manual',
  CHANNEL_MANAGER = 'channel_manager', 
  DYNAMIC_PRICING = 'dynamic_pricing',
  API_UPDATE = 'api_update',
  BULK_IMPORT = 'bulk_import',
  SYSTEM_DEFAULT = 'system_default'
}

/**
 * Configuración de rangos de fechas para operaciones bulk
 */
export const DATE_RANGES = {
  MAX_FUTURE_DAYS: 1095, // ~3 años hacia adelante
  MAX_BULK_DAYS: 365,    // Máximo para operaciones bulk
  DEFAULT_HORIZON: 730,  // 2 años por defecto
} as const