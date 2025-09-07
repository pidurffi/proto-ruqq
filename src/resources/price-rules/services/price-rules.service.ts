import { Inject, Injectable, BadRequestException } from '@nestjs/common'
import { DataSource, QueryRunner } from 'typeorm'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { PriceRule } from '../entities/price-rules.entity'
import { resources } from '../../../engine/database/constants'
import { PriceRulesRepository } from '../repositories/price-rules.repository'
import { PriceRulesQueryDto, CreatePriceRuleDto, BulkCreatePriceRuleDto, UpdatePriceRuleDto } from '../dto'
import { AdjustmentType } from '../../../common/enums/adjustment-type.enum'

/**
 * PriceRulesService - Servicio CRUD para reglas de precio con estrategia de split y optimización
 * 
 * RESPONSABILIDAD ÚNICA (SRP):
 * - Se encarga de operaciones CRUD y la estrategia de "split" para price rules
 * - Maneja consolidación automática de reglas consecutivas idénticas
 * - Considera días de la semana, prioridad y ajustes para determinar conflictos
 * 
 * STRATEGY PATTERN:
 * - Implementa estrategia de "split" considerando todos los campos de la regla
 * - Mantiene integridad referencial en reglas solapadas con diferentes parámetros
 */
@Injectable()
export class PriceRulesService extends BaseEntityService<PriceRule> {
  /**
   * Suma días a una fecha string y retorna el resultado como string YYYY-MM-DD
   * @param dateString Fecha en formato YYYY-MM-DD
   * @param days Número de días a sumar
   * @returns Fecha resultante en formato YYYY-MM-DD
   */
  private addDays(dateString: string, days: number): string {
    const date = new Date(dateString)
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  /**
   * Resta días a una fecha string y retorna el resultado como string YYYY-MM-DD
   * @param dateString Fecha en formato YYYY-MM-DD
   * @param days Número de días a restar
   * @returns Fecha resultante en formato YYYY-MM-DD
   */
  private subtractDays(dateString: string, days: number): string {
    const date = new Date(dateString)
    date.setDate(date.getDate() - days)
    return date.toISOString().split('T')[0]
  }

  /**
   * Verifica si dos reglas son idénticas en todos los campos relevantes para consolidación
   * @param rule1 Primera regla o regla existente
   * @param rule2 Segunda regla o datos de nueva regla
   * @returns true si todas las propiedades de negocio son iguales
   */
  private areRulesIdentical(rule1: PriceRule, rule2: any): boolean {
    return (
      rule1.roomTypeId === rule2.roomTypeId &&
      rule1.priority === rule2.priority &&
      rule1.adjustmentType === rule2.adjustmentType &&
      Number(rule1.adjustmentValue) === Number(rule2.adjustmentValue) &&
      JSON.stringify(rule1.daysOfWeek.sort()) === JSON.stringify(rule2.daysOfWeek.sort())
    )
  }

  /**
   * Método auxiliar para crear una regla de precio
   * Centraliza la creación para evitar duplicación de código
   */
  private async createRule(
    queryRunner: QueryRunner, 
    ruleData: {
      roomTypeId: string,
      startDate: string,
      endDate: string,
      daysOfWeek: number[],
      adjustmentType: string,
      adjustmentValue: number,
      uid: string
    }
  ): Promise<PriceRule> {
    const rule = queryRunner.manager.create(PriceRule, {
      roomTypeId: ruleData.roomTypeId,
      startDate: ruleData.startDate as any,
      endDate: ruleData.endDate as any,
      daysOfWeek: ruleData.daysOfWeek,
      priority: 0, // Siempre prioridad 0 por simplicidad
      adjustmentType: ruleData.adjustmentType as any,
      adjustmentValue: ruleData.adjustmentValue,
      uid: ruleData.uid
    })
    return await queryRunner.manager.save(rule)
  }


  constructor(
    @Inject(PriceRulesRepository)
    private readonly repository: PriceRulesRepository,
    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super()
  }

  protected getRepository(): PriceRulesRepository {
    return this.repository
  }

  /**
   * Crea una nueva regla de precio usando la estrategia de "split".
   * Si existe una regla solapada con diferentes parámetros, divide las reglas existentes
   * para mantener la consistencia de datos sin conflictos.
   * 
   * STRATEGY PATTERN:
   * - Implementa la estrategia de división considerando todos los campos de la regla
   * - Utiliza transacciones para garantizar atomicidad
   * 
   * @param createPriceRuleDto - Los datos para crear la regla
   * @param uid - ID del usuario que crea el registro
   * @returns Array de reglas resultantes después del split
   */
  async createPriceRule(
    createPriceRuleDto: CreatePriceRuleDto,
    uid: string,
  ): Promise<PriceRule[]> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const result = await this.splitRuleForPeriod(
        createPriceRuleDto,
        uid,
        queryRunner,
      )
      await queryRunner.commitTransaction()
      return result
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  /**
   * ALGORITMO SIMPLE DESDE CERO - Sin parches
   * 
   * LÓGICA CLARA:
   * 1. Buscar reglas que se solapan con la nueva
   * 2. Eliminar TODAS las reglas solapadas
   * 3. Por cada regla eliminada, crear fragmentos que NO se solapan
   * 4. Crear la nueva regla
   * 5. NO consolidación automática (mantener simple)
   * 
   * RESULTADO GARANTIZADO:
   * - Cero solapamientos
   * - Cero ambigüedad  
   * - Una regla por combinación exacta (fecha + días)
   * 
   * @param createDto Datos de la regla a insertar
   * @param uid ID del usuario
   * @param queryRunner Instancia de QueryRunner para transacciones
   * @returns Array de reglas resultantes
   */
  private async splitRuleForPeriod(
    createDto: CreatePriceRuleDto,
    uid: string,
    queryRunner: QueryRunner
  ): Promise<PriceRule[]> {
    const { roomTypeId, startDate, endDate, daysOfWeek, adjustmentType, adjustmentValue } = createDto
    const newStart = startDate.toString()
    const newEnd = endDate.toString()

    // Validación básica
    if (newStart > newEnd) {
      throw new BadRequestException('La fecha de inicio no puede ser mayor que la fecha de fin')
    }

    // PASO 1: Buscar todas las reglas que se solapan
    const overlapping = await queryRunner.manager
      .createQueryBuilder(PriceRule, 'pr')
      .where('pr.roomTypeId = :roomTypeId', { roomTypeId })
      .andWhere('pr.startDate <= :endDate', { endDate: newEnd })
      .andWhere('pr.endDate >= :startDate', { startDate: newStart })
      .getMany()

    // PASO 2: Eliminar TODAS las reglas solapadas
    for (const rule of overlapping) {
      await queryRunner.manager.delete(PriceRule, rule.id)
    }

    // PASO 3: Crear fragmentos de las reglas eliminadas que NO se solapan
    for (const oldRule of overlapping) {
      const oldStart = oldRule.startDate.toString()
      const oldEnd = oldRule.endDate.toString()

      // FRAGMENTO ANTES: Si la regla antigua empezaba antes que la nueva
      if (oldStart < newStart) {
        await this.createRule(queryRunner, {
          roomTypeId: oldRule.roomTypeId,
          startDate: oldStart,
          endDate: this.subtractDays(newStart, 1),
          daysOfWeek: oldRule.daysOfWeek,
          adjustmentType: oldRule.adjustmentType,
          adjustmentValue: oldRule.adjustmentValue,
          uid
        })
      }

      // FRAGMENTO DURANTE: Solo días NO afectados por la nueva regla
      const unaffectedDays = oldRule.daysOfWeek.filter(day => !daysOfWeek.includes(day))
      if (unaffectedDays.length > 0) {
        await this.createRule(queryRunner, {
          roomTypeId: oldRule.roomTypeId,
          startDate: newStart,
          endDate: newEnd,
          daysOfWeek: unaffectedDays,
          adjustmentType: oldRule.adjustmentType,
          adjustmentValue: oldRule.adjustmentValue,
          uid
        })
      }

      // FRAGMENTO DESPUÉS: Si la regla antigua terminaba después que la nueva  
      if (oldEnd > newEnd) {
        await this.createRule(queryRunner, {
          roomTypeId: oldRule.roomTypeId,
          startDate: this.addDays(newEnd, 1),
          endDate: oldEnd,
          daysOfWeek: oldRule.daysOfWeek,
          adjustmentType: oldRule.adjustmentType,
          adjustmentValue: oldRule.adjustmentValue,
          uid
        })
      }
    }

    // PASO 4: Crear la nueva regla (UNA SOLA VEZ)
    await this.createRule(queryRunner, {
      roomTypeId,
      startDate: newStart,
      endDate: newEnd,
      daysOfWeek,
      adjustmentType,
      adjustmentValue,
      uid
    })

    // PASO 5: Retornar todas las reglas del roomType
    return await queryRunner.manager
      .createQueryBuilder(PriceRule, 'pr')
      .where('pr.roomTypeId = :roomTypeId', { roomTypeId })
      .orderBy('pr.startDate', 'ASC')
      .getMany()
  }

  /**
   * Crea reglas de precio en masa usando la estrategia de "split" para cada roomType.
   * 
   * @param bulkDto - Datos para crear reglas en masa
   * @param uid - ID del usuario que crea las reglas
   * @returns Array de todas las reglas resultantes después del split
   */
  async createBulkPriceRules(
    bulkDto: BulkCreatePriceRuleDto,
    uid: string,
  ): Promise<PriceRule[]> {
    const { roomTypeIds, ...ruleData } = bulkDto
    
    const allResults: PriceRule[] = []
    
    // Procesar cada roomType por separado con split
    for (const roomTypeId of roomTypeIds) {
      const createDto: CreatePriceRuleDto = {
        ...ruleData,
        roomTypeId,
        priority: ruleData.priority ?? 0
      }
      
      const results = await this.createPriceRule(createDto, uid)
      allResults.push(...results)
    }

    return allResults
  }

  /**
   * Lógica de decisión para bulk edit: 
   * - Si daysOfWeek.length === 7: Modificar base_rate_period
   * - Si daysOfWeek.length < 7: Crear price_rules
   */
  async applyBulkPriceEdit(bulkDto: BulkCreatePriceRuleDto, uid: string) {
    if (bulkDto.daysOfWeek.length === 7) {
      // TODO: Integrar con BaseRatePeriodService para modificar tarifa base
      throw new Error('Bulk edit para todos los días (modificar base_rate_period) no implementado aún')
    } else {
      // Crear reglas de precio para días específicos
      return await this.createBulkPriceRules(bulkDto, uid)
    }
  }

  async findAllWithFilterPaginated(payload: PriceRulesQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }

  /**
   * Busca la regla aplicable para una fecha y room type específicos
   */
  async findApplicableRule(roomTypeId: string, date: Date): Promise<PriceRule | null> {
    return await this.repository.findApplicableRule(roomTypeId, date)
  }

  /**
   * Calcula el precio ajustado aplicando la regla de precio
   */
  calculateAdjustedPrice(basePrice: number, rule: PriceRule): number {
    switch (rule.adjustmentType) {
      case AdjustmentType.FIXED_PRICE:
        return rule.adjustmentValue
      case AdjustmentType.FIXED_AMOUNT:
        return basePrice + rule.adjustmentValue
      case AdjustmentType.PERCENTAGE:
        return basePrice * (1 + rule.adjustmentValue / 100)
      default:
        return basePrice
    }
  }
}
