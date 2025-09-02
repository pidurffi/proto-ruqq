import { Inject, Injectable } from '@nestjs/common'

import { PriceRulesService } from '../../price-rules/services/price-rules.service'
import { BaseRatePeriodService } from '../../base-rate-period/services/base-rate-period.service'
import { CalendarBulkEditDto } from '../dto'

/**
 * CalendarService - Orchestrator de Alto Nivel para Edición de Calendario
 * 
 * RESPONSABILIDAD PRINCIPAL:
 * - Actúa como enrutador inteligente para modificaciones de precio masivas
 * - Decide automáticamente si usar base_rate_period o price_rules
 * - Abstrae la complejidad del modelo de capas para el usuario final
 * 
 * DOMAIN-DRIVEN DESIGN:
 * - Representa un Servicio de Aplicación que orquesta múltiples Servicios de Dominio
 * - Encapsula la lógica de decisión del negocio de manera transparente
 * - Ofrece una interfaz unificada para edición de calendario
 */
@Injectable()
export class CalendarService {
  constructor(
    @Inject(PriceRulesService)
    private readonly priceRulesService: PriceRulesService,
    @Inject(BaseRatePeriodService) 
    private readonly baseRatePeriodService: BaseRatePeriodService,
  ) {}

  /**
   * Edición masiva de calendario con enrutamiento automático
   * 
   * LÓGICA DE DECISIÓN INTELIGENTE:
   * - Si daysOfWeek.length === 7: Modificar tarifa base (base_rate_period)
   * - Si daysOfWeek.length < 7: Crear reglas de precio (price_rules)
   * 
   * BENEFICIOS:
   * - API unificada y agnóstica al mecanismo interno
   * - Transparente para el cliente - no necesita saber sobre capas
   * - Escalable para futuras estrategias de pricing
   * 
   * @param bulkEditDto Datos de la edición masiva
   * @param uid Usuario que ejecuta la acción
   * @returns Resultado de la operación (base_rate_period o price_rules)
   */
  async bulkEdit(bulkEditDto: CalendarBulkEditDto, uid: string) {
    const { daysOfWeek } = bulkEditDto

    if (daysOfWeek.length === 7) {
      // TODOS LOS DÍAS: Modificar tarifa base fundamental
      // Esto representa un cambio en el "lienzo base" del pricing
      // TODO: Implementar integración completa con BaseRatePeriodService
      throw new Error('Edición masiva para todos los días (modificar base_rate_period) no implementada aún. Use price_rules para días específicos.')
    } else {
      // DÍAS ESPECÍFICOS: Crear reglas de precio (overrides)
      // Esto representa "calcomanías" sobre el lienzo base
      return await this.priceRulesService.applyBulkPriceEdit(bulkEditDto, uid)
    }
  }

  /**
   * Obtiene un resumen del impacto de la edición sin aplicarla
   * 
   * FUNCIONALIDAD DE PREVIEW:
   * - Permite al usuario ver qué va a cambiar antes de confirmar
   * - Identifica conflictos potenciales con reglas existentes
   * - Calcula el impacto estimado en revenue
   */
  async previewBulkEdit(bulkEditDto: CalendarBulkEditDto): Promise<{
    action: 'modify_base_rates' | 'create_price_rules'
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
    // TODO: Implementar lógica de preview
    // Esto sería una funcionalidad premium para dar visibilidad total
    
    return {
      action: bulkEditDto.daysOfWeek.length === 7 ? 'modify_base_rates' : 'create_price_rules',
      impactedRoomTypes: bulkEditDto.roomTypeIds.length,
      impactedNights: 0, // Calcular basado en rango de fechas
      estimatedChanges: []
    }
  }
}
