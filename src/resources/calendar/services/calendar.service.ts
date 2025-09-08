import { Inject, Injectable } from '@nestjs/common'

import { DailyRatesService } from '../../daily-room-rates/services/daily-room-rates.service'  // ← Nuevo servicio OTA
import { CalendarBulkEditDto } from '../dto'

/**
 * CalendarService - REFACTORIZADO para modelo OTA diario
 * 
 * SIMPLIFICACIÓN MASIVA:
 * - ANTES: Orquestaba BaseRatePeriodService + PriceRulesService + lógica compleja de enrutamiento
 * - AHORA: Opera directamente con DailyRatesService (modelo OTA estándar)
 * 
 * ELIMINAMOS:
 * ❌ Lógica de decisión entre base_rate_period vs price_rules
 * ❌ Conceptos de "capas" y "calcomanías"
 * ❌ Enrutamiento automático complejo
 * 
 * NUEVA LÓGICA SIMPLE:
 * ✅ Edición directa de daily_room_rates por fecha
 * ✅ Compatible 100% con APIs de OTAs
 * ✅ Una sola tabla, una sola lógica
 */
@Injectable()
export class CalendarService {
  constructor(
    @Inject(DailyRatesService)
    private readonly dailyRatesService: DailyRatesService,
  ) {}

  /**
   * Edición masiva de calendario - VERSIÓN ULTRA-SIMPLIFICADA
   * 
   * ANTES: Lógica compleja de enrutamiento entre base_rate_period y price_rules
   * AHORA: Operación directa sobre daily_room_rates
   * 
   * @param bulkEditDto Datos de la edición masiva
   * @param uid Usuario que ejecuta la acción
   * @returns Resultado de la operación directa en modelo OTA
   */
  async bulkEdit(bulkEditDto: CalendarBulkEditDto, uid: string) {
    // NUEVA LÓGICA SIMPLE: Aplicar cambios directamente a daily_room_rates
    return await this.dailyRatesService.bulkUpdateRates(bulkEditDto, uid)
  }

  /**
   * Preview de edición masiva - SIMPLIFICADO
   * 
   * ANTES: Diferenciaba entre modify_base_rates y create_price_rules
   * AHORA: Solo operación directa sobre daily_room_rates
   * 
   * @param bulkEditDto Parámetros de la edición
   * @returns Preview simplificado del impacto
   */
  async previewBulkEdit(bulkEditDto: CalendarBulkEditDto): Promise<{
    action: 'update_daily_rates'
    impactedRoomTypes: number
    impactedNights: number
    estimatedChanges: Array<{
      roomTypeId: string
      roomTypeName: string
      nightsAffected: number
      currentPriceRange: { min: number; max: number }
      newPriceRange: { min: number; max: number }
    }>
  }> {
    return await this.dailyRatesService.previewBulkUpdate(bulkEditDto)
  }
}
