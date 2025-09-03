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
   * @param rule1 Primera regla
   * @param rule2 Segunda regla
   * @returns true si todas las propiedades de negocio son iguales
   */
  private areRulesIdentical(rule1: PriceRule, rule2: PriceRule): boolean {
    return (
      rule1.roomTypeId === rule2.roomTypeId &&
      rule1.priority === rule2.priority &&
      rule1.adjustmentType === rule2.adjustmentType &&
      Number(rule1.adjustmentValue) === Number(rule2.adjustmentValue) &&
      JSON.stringify(rule1.daysOfWeek.sort()) === JSON.stringify(rule2.daysOfWeek.sort())
    )
  }

  /**
   * Consolida reglas consecutivas idénticas para evitar fragmentación.
   * 
   * Busca reglas del mismo roomTypeId que sean idénticas en todos los campos
   * y tengan períodos consecutivos, fusionándolas en una sola regla.
   * 
   * @param roomTypeId ID del tipo de habitación
   * @param queryRunner Instancia de QueryRunner para transacciones
   * @returns Array de reglas consolidadas
   */
  private async consolidateConsecutiveRules(
    roomTypeId: string,
    queryRunner: QueryRunner
  ): Promise<PriceRule[]> {
    // Obtener todas las reglas del roomType ordenadas por fecha de inicio
    const allRules = await queryRunner.manager
      .createQueryBuilder(PriceRule, 'pr')
      .where('pr.roomTypeId = :roomTypeId', { roomTypeId })
      .orderBy('pr.startDate', 'ASC')
      .addOrderBy('pr.endDate', 'ASC')
      .getMany()

    if (allRules.length <= 1) {
      return allRules
    }

    const consolidatedRules: PriceRule[] = []
    const rulesToDelete: string[] = []
    
    let currentGroup = [allRules[0]]

    for (let i = 1; i < allRules.length; i++) {
      const current = allRules[i]
      const lastInGroup = currentGroup[currentGroup.length - 1]

      // Verificar si la regla actual es consecutiva e idéntica
      const lastEndDate = lastInGroup.endDate.toString()
      const currentStartDate = current.startDate.toString()
      const nextDayAfterLast = this.addDays(lastEndDate, 1)
      
      const isConsecutive = currentStartDate === nextDayAfterLast
      const areIdentical = this.areRulesIdentical(lastInGroup, current)

      if (isConsecutive && areIdentical) {
        // Agregar al grupo actual para consolidación
        currentGroup.push(current)
      } else {
        // Procesar el grupo actual y empezar uno nuevo
        if (currentGroup.length > 1) {
          // Consolidar el grupo
          const consolidated = await this.consolidateRuleGroup(currentGroup, queryRunner)
          consolidatedRules.push(consolidated)
          
          // Marcar reglas del grupo para eliminación (excepto la primera que se actualizó)
          for (let j = 1; j < currentGroup.length; j++) {
            rulesToDelete.push(currentGroup[j].id)
          }
        } else {
          // El grupo tiene solo una regla, mantenerla tal como está
          consolidatedRules.push(currentGroup[0])
        }
        
        // Empezar nuevo grupo
        currentGroup = [current]
      }
    }

    // Procesar el último grupo
    if (currentGroup.length > 1) {
      const consolidated = await this.consolidateRuleGroup(currentGroup, queryRunner)
      consolidatedRules.push(consolidated)
      
      for (let j = 1; j < currentGroup.length; j++) {
        rulesToDelete.push(currentGroup[j].id)
      }
    } else {
      consolidatedRules.push(currentGroup[0])
    }

    // Eliminar reglas redundantes
    for (const ruleId of rulesToDelete) {
      await queryRunner.manager.delete(PriceRule, ruleId)
    }

    return consolidatedRules
  }

  /**
   * Consolida un grupo de reglas consecutivas idénticas en una sola.
   * 
   * @param group Array de reglas consecutivas idénticas
   * @param queryRunner Instancia de QueryRunner para transacciones
   * @returns Regla consolidada resultante
   */
  private async consolidateRuleGroup(
    group: PriceRule[],
    queryRunner: QueryRunner
  ): Promise<PriceRule> {
    if (group.length === 0) {
      throw new Error('El grupo no puede estar vacío')
    }

    if (group.length === 1) {
      return group[0]
    }

    // Tomar la primera regla como base y extender su fecha de fin
    const firstRule = group[0]
    const lastRule = group[group.length - 1]

    // Actualizar la primera regla para que cubra todo el rango
    await queryRunner.manager.update(PriceRule, firstRule.id, {
      endDate: lastRule.endDate
    })

    // Obtener la regla actualizada
    const updatedRule = await queryRunner.manager.findOne(PriceRule, {
      where: { id: firstRule.id }
    })

    return updatedRule || firstRule
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
   * Implementa la estrategia de "split" inteligente para reglas de precio.
   * 
   * LÓGICA INTELIGENTE:
   * - Solo modifica reglas donde los parámetros realmente cambian
   * - Analiza cada regla solapada para determinar qué partes necesitan cambio
   * - Evita splits innecesarios cuando todos los campos ya son iguales
   * 
   * Casos que maneja:
   * 1. Si todo el rango ya tiene los parámetros correctos: NO hace nada
   * 2. Split inteligente: Solo modifica partes con parámetros diferentes
   * 3. Preserva reglas existentes con parámetros idénticos
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
    const { roomTypeId, startDate, endDate, daysOfWeek, priority, adjustmentType, adjustmentValue } = createDto
    const newStartDate = startDate.toString()
    const newEndDate = endDate.toString()

    // Validación básica de fechas
    if (newStartDate > newEndDate) {
      throw new BadRequestException('La fecha de inicio no puede ser mayor que la fecha de fin')
    }

    // Buscar reglas que se solapan con el nuevo rango
    const overlappingRules = await queryRunner.manager
      .createQueryBuilder(PriceRule, 'pr')
      .where('pr.roomTypeId = :roomTypeId', { roomTypeId })
      .andWhere('pr.startDate <= :endDate', { endDate: newEndDate })
      .andWhere('pr.endDate >= :startDate', { startDate: newStartDate })
      .orderBy('pr.startDate', 'ASC')
      .getMany()

    // Si no hay reglas solapadas, crear directamente
    if (overlappingRules.length === 0) {
      const newRule = queryRunner.manager.create(PriceRule, {
        roomTypeId,
        startDate: newStartDate as any,
        endDate: newEndDate as any,
        daysOfWeek,
        priority: priority ?? 0,
        adjustmentType,
        adjustmentValue,
        uid
      })
      return [await queryRunner.manager.save(newRule)]
    }

    // LÓGICA INTELIGENTE: Analizar qué partes del rango realmente necesitan cambio
    const results: PriceRule[] = []
    const rulesToDelete: string[] = []
    const rulesToUpdate: Array<{id: string, updates: Partial<PriceRule>}> = []
    const rulesToCreate: Array<Partial<PriceRule>> = []
    
    // Determinar qué partes del rango nuevo necesitan ser insertadas
    const rangesToInsert: Array<{startDate: string, endDate: string}> = []
    let currentDate = newStartDate

    // Analizar cada regla solapada para determinar qué partes cambiar
    for (const overlappingRule of overlappingRules) {
      const overlappingStart = overlappingRule.startDate.toString()
      const overlappingEnd = overlappingRule.endDate.toString()
      
      // Calcular intersección entre la nueva regla y la regla existente
      const intersectionStart = newStartDate > overlappingStart ? newStartDate : overlappingStart
      const intersectionEnd = newEndDate < overlappingEnd ? newEndDate : overlappingEnd
      
      // Si no hay intersección válida, continuar
      if (intersectionStart > intersectionEnd) continue

      // CASO CLAVE: Si TODOS los campos son iguales en la intersección, no modificar
      const newRuleData = {
        roomTypeId,
        daysOfWeek: daysOfWeek.sort(),
        priority: priority ?? 0,
        adjustmentType,
        adjustmentValue
      }
      
      const existingRuleData = {
        roomTypeId: overlappingRule.roomTypeId,
        daysOfWeek: overlappingRule.daysOfWeek.sort(),
        priority: overlappingRule.priority,
        adjustmentType: overlappingRule.adjustmentType,
        adjustmentValue: overlappingRule.adjustmentValue
      }

      const areAllFieldsIdentical = (
        newRuleData.roomTypeId === existingRuleData.roomTypeId &&
        newRuleData.priority === existingRuleData.priority &&
        newRuleData.adjustmentType === existingRuleData.adjustmentType &&
        Number(newRuleData.adjustmentValue) === Number(existingRuleData.adjustmentValue) &&
        JSON.stringify(newRuleData.daysOfWeek) === JSON.stringify(existingRuleData.daysOfWeek)
      )

      if (areAllFieldsIdentical) {
        // Agregar rangos anteriores a la intersección si existen
        if (currentDate < intersectionStart) {
          rangesToInsert.push({
            startDate: currentDate,
            endDate: this.subtractDays(intersectionStart, 1)
          })
        }
        // Saltar la intersección porque ya tiene los parámetros correctos
        currentDate = this.addDays(intersectionEnd, 1)
        continue
      }

      // CASO: Parámetros diferentes, necesitamos hacer split
      
      // 1. Agregar rango anterior a la intersección si existe
      if (currentDate < intersectionStart) {
        rangesToInsert.push({
          startDate: currentDate,
          endDate: this.subtractDays(intersectionStart, 1)
        })
      }

      // 2. Agregar la intersección como rango a insertar
      rangesToInsert.push({
        startDate: intersectionStart,
        endDate: intersectionEnd
      })

      // 3. Manejar la regla existente solapada
      
      // Si la regla existente empieza antes de la intersección, acortarla
      if (overlappingStart < intersectionStart) {
        rulesToUpdate.push({
          id: overlappingRule.id,
          updates: { endDate: this.subtractDays(intersectionStart, 1) as any }
        })
      } else {
        // Si no hay parte anterior, marcar para eliminar
        rulesToDelete.push(overlappingRule.id)
      }

      // Si la regla existente continúa después de la intersección, crear resto
      if (overlappingEnd > intersectionEnd) {
        rulesToCreate.push({
          roomTypeId,
          startDate: this.addDays(intersectionEnd, 1) as any,
          endDate: overlappingEnd as any,
          daysOfWeek: overlappingRule.daysOfWeek,
          priority: overlappingRule.priority,
          adjustmentType: overlappingRule.adjustmentType,
          adjustmentValue: overlappingRule.adjustmentValue,
          uid
        })
      }

      currentDate = this.addDays(intersectionEnd, 1)
    }

    // Agregar rango final si existe
    if (currentDate <= newEndDate) {
      rangesToInsert.push({
        startDate: currentDate,
        endDate: newEndDate
      })
    }

    // Ejecutar todas las operaciones de base de datos
    
    // 1. Eliminar reglas marcadas
    for (const ruleId of rulesToDelete) {
      await queryRunner.manager.delete(PriceRule, ruleId)
    }

    // 2. Actualizar reglas que fueron parcialmente cubiertas
    for (const updateData of rulesToUpdate) {
      await queryRunner.manager.update(PriceRule, updateData.id, updateData.updates)
    }

    // 3. Crear reglas restantes después de los splits
    for (const createData of rulesToCreate) {
      const newRule = queryRunner.manager.create(PriceRule, createData)
      results.push(await queryRunner.manager.save(newRule))
    }

    // 4. Crear nuevas reglas solo donde realmente se necesita
    for (const rangeData of rangesToInsert) {
      if (rangeData.startDate <= rangeData.endDate) {
        const newRule = queryRunner.manager.create(PriceRule, {
          roomTypeId,
          startDate: rangeData.startDate as any,
          endDate: rangeData.endDate as any,
          daysOfWeek,
          priority: priority ?? 0,
          adjustmentType,
          adjustmentValue,
          uid
        })
        results.push(await queryRunner.manager.save(newRule))
      }
    }

    // 5. CONSOLIDACIÓN AUTOMÁTICA: Fusionar reglas consecutivas idénticas
    // Esto evita fragmentación innecesaria después de múltiples operaciones de split
    await this.consolidateConsecutiveRules(roomTypeId, queryRunner)
    
    // Retornar todas las reglas actualizadas del roomType
    const finalRules = await queryRunner.manager
      .createQueryBuilder(PriceRule, 'pr')
      .where('pr.roomTypeId = :roomTypeId', { roomTypeId })
      .orderBy('pr.startDate', 'ASC')
      .getMany()

    return finalRules
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
