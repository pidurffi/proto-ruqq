import { Inject, Injectable, BadRequestException } from '@nestjs/common'
import { DataSource, QueryRunner } from 'typeorm'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { BaseRatePeriod } from '../entities/base-rate-period.entity'
import { resources } from '../../../engine/database/constants'
import { BaseRatePeriodRepository } from '../repositories/base-rate-period.repository'
import { BaseRatePeriodQueryDto, BaseRatePeriodCreateDto } from '../dto'

/**
 * BaseRatePeriodService - Servicio CRUD para períodos de tarifa base
 * 
 * RESPONSABILIDAD ÚNICA (SRP):
 * - Se encarga únicamente de operaciones CRUD y la estrategia de "split"
 * - NO calcula precios (esa es responsabilidad de QuotesService)
 * - NO maneja lógica de dominio de cotización de precios
 * 
 * STRATEGY PATTERN:
 * - Implementa la estrategia de "split" para evitar conflictos de datos
 * - Mantiene integridad referencial en períodos de tarifas solapados
 */
@Injectable()
export class BaseRatePeriodService extends BaseEntityService<BaseRatePeriod> {
  /**
   * Suma días a una fecha string y retorna el resultado como string YYYY-MM-DD
   * @param dateString Fecha en formato YYYY-MM-DD
   * @param days Número de días a sumar
   * @returns Fecha resultante en formato YYYY-MM-DD
   */
  private addDays(dateString: string, days: number): string {
    const date = new Date(dateString + 'T00:00:00.000Z')
    date.setUTCDate(date.getUTCDate() + days)
    return date.toISOString().split('T')[0]
  }

  /**
   * Resta días a una fecha string y retorna el resultado como string YYYY-MM-DD
   * @param dateString Fecha en formato YYYY-MM-DD
   * @param days Número de días a restar
   * @returns Fecha resultante en formato YYYY-MM-DD
   */
  private subtractDays(dateString: string, days: number): string {
    const date = new Date(dateString + 'T00:00:00.000Z')
    date.setUTCDate(date.getUTCDate() - days)
    return date.toISOString().split('T')[0]
  }

  /**
   * Consolida períodos consecutivos con el mismo precio para evitar fragmentación.
   * 
   * Busca períodos del mismo roomTypeId y precio que sean consecutivos en fechas
   * y los fusiona en un solo período para mantener la base de datos limpia.
   * 
   * Ejemplo: 
   * [1/1-10/1 $100] + [11/1-20/1 $100] + [21/1-31/1 $100] = [1/1-31/1 $100]
   * 
   * @param roomTypeId ID del tipo de habitación
   * @param queryRunner Instancia de QueryRunner para transacciones
   * @returns Array de períodos consolidados
   */
  private async consolidateConsecutivePeriods(
    roomTypeId: string,
    queryRunner: QueryRunner
  ): Promise<BaseRatePeriod[]> {
    // Obtener todos los períodos del roomType ordenados por fecha de inicio
    const allPeriods = await queryRunner.manager
      .createQueryBuilder(BaseRatePeriod, 'brp')
      .where('brp.roomTypeId = :roomTypeId', { roomTypeId })
      .orderBy('brp.startDate', 'ASC')
      .addOrderBy('brp.endDate', 'ASC')
      .getMany()

    if (allPeriods.length <= 1) {
      return allPeriods
    }

    const consolidatedPeriods: BaseRatePeriod[] = []
    const periodsToDelete: string[] = []
    
    let currentGroup = [allPeriods[0]]

    for (let i = 1; i < allPeriods.length; i++) {
      const current = allPeriods[i]
      const lastInGroup = currentGroup[currentGroup.length - 1]

      // Verificar si el período actual es consecutivo y tiene el mismo precio
      const lastEndDate = lastInGroup.endDate.toString()
      const currentStartDate = current.startDate.toString()
      const nextDayAfterLast = this.addDays(lastEndDate, 1)
      
      const isConsecutive = currentStartDate === nextDayAfterLast
      const hasSamePrice = Number(lastInGroup.price) === Number(current.price)

      if (isConsecutive && hasSamePrice) {
        // Agregar al grupo actual para consolidación
        currentGroup.push(current)
      } else {
        // Procesar el grupo actual y empezar uno nuevo
        if (currentGroup.length > 1) {
          // Consolidar el grupo
          const consolidated = await this.consolidateGroup(currentGroup, queryRunner)
          consolidatedPeriods.push(consolidated)
          
          // Marcar períodos del grupo para eliminación (excepto el primero que se actualizó)
          for (let j = 1; j < currentGroup.length; j++) {
            periodsToDelete.push(currentGroup[j].id)
          }
        } else {
          // El grupo tiene solo un período, mantenerlo tal como está
          consolidatedPeriods.push(currentGroup[0])
        }
        
        // Empezar nuevo grupo
        currentGroup = [current]
      }
    }

    // Procesar el último grupo
    if (currentGroup.length > 1) {
      const consolidated = await this.consolidateGroup(currentGroup, queryRunner)
      consolidatedPeriods.push(consolidated)
      
      for (let j = 1; j < currentGroup.length; j++) {
        periodsToDelete.push(currentGroup[j].id)
      }
    } else {
      consolidatedPeriods.push(currentGroup[0])
    }

    // Eliminar períodos redundantes
    for (const periodId of periodsToDelete) {
      await queryRunner.manager.delete(BaseRatePeriod, periodId)
    }

    return consolidatedPeriods
  }

  /**
   * Consolida un grupo de períodos consecutivos con el mismo precio en uno solo.
   * 
   * @param group Array de períodos consecutivos con el mismo precio
   * @param queryRunner Instancia de QueryRunner para transacciones
   * @returns Período consolidado resultante
   */
  private async consolidateGroup(
    group: BaseRatePeriod[],
    queryRunner: QueryRunner
  ): Promise<BaseRatePeriod> {
    if (group.length === 0) {
      throw new Error('El grupo no puede estar vacío')
    }

    if (group.length === 1) {
      return group[0]
    }

    // Tomar el primer período como base y extender su fecha de fin
    const firstPeriod = group[0]
    const lastPeriod = group[group.length - 1]

    // Actualizar el primer período para que cubra todo el rango
    await queryRunner.manager.update(BaseRatePeriod, firstPeriod.id, {
      endDate: lastPeriod.endDate
    })

    // Obtener el período actualizado
    const updatedPeriod = await queryRunner.manager.findOne(BaseRatePeriod, {
      where: { id: firstPeriod.id }
    })

    return updatedPeriod || firstPeriod
  }
  
  constructor(
    @Inject(BaseRatePeriodRepository)
    private readonly repository: BaseRatePeriodRepository,
    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super()
  }

  protected getRepository(): BaseRatePeriodRepository {
    return this.repository
  }

  /**
   * Crea un nuevo período de tarifa base usando la estrategia de "split".
   * Si existe un período solapado con diferente precio, divide los períodos existentes
   * para mantener la consistencia de datos sin conflictos.
   * 
   * STRATEGY PATTERN:
   * - Implementa la estrategia de división para evitar solapamientos
   * - Utiliza transacciones para garantizar atomicidad
   * 
   * @param createDto - Los datos para crear el período
   * @param uid - ID del usuario que crea el registro
   * @returns Array de períodos resultantes después del split
   */
  async createBaseRatePeriod(
    createDto: BaseRatePeriodCreateDto,
    uid: string,
  ): Promise<BaseRatePeriod[]> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const result = await this.splitRateForPeriod(
        createDto,
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

  async findAllWithFilterPaginated(payload: BaseRatePeriodQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }

  /**
   * Implementa la estrategia de "split" inteligente para períodos de tarifas.
   * 
   * LÓGICA INTELIGENTE:
   * - Solo modifica segmentos donde el precio realmente cambia
   * - Analiza cada período solapado para determinar qué partes necesitan cambio
   * - Evita splits innecesarios cuando el precio ya es igual
   * 
   * Casos que maneja:
   * 1. Si todo el rango ya tiene el precio correcto: NO hace nada
   * 2. Split inteligente: Solo modifica partes con precio diferente
   * 3. Preserva segmentos existentes con el precio correcto
   * 
   * Ejemplo complejo: 
   * Estado: [1/1-31/12 $500] + [1/2-10/2 $600]
   * Inserción: [10/1-5/2 $500]
   * Resultado: [1/1-31/12 $500] + [6/2-10/2 $600] (solo cambia donde hay diferencia)
   * 
   * @param createDto Datos del período a insertar
   * @param uid ID del usuario
   * @param queryRunner Instancia de QueryRunner para transacciones
   * @returns Array de períodos resultantes
   */
  private async splitRateForPeriod(
    createDto: BaseRatePeriodCreateDto,
    uid: string,
    queryRunner: QueryRunner
  ): Promise<BaseRatePeriod[]> {
    const { roomTypeId, startDate, endDate, price } = createDto
    const newStartDate = startDate.toString()
    const newEndDate = endDate.toString()

    // Validación básica de fechas
    if (newStartDate > newEndDate) {
      throw new BadRequestException('La fecha de inicio no puede ser mayor que la fecha de fin')
    }

    // Buscar períodos que se solapan con el nuevo rango
    const overlappingPeriods = await queryRunner.manager
      .createQueryBuilder(BaseRatePeriod, 'brp')
      .where('brp.roomTypeId = :roomTypeId', { roomTypeId })
      .andWhere('brp.startDate <= :endDate', { endDate: newEndDate })
      .andWhere('brp.endDate >= :startDate', { startDate: newStartDate })
      .orderBy('brp.startDate', 'ASC')
      .getMany()

    // Si no hay períodos solapados, crear directamente
    if (overlappingPeriods.length === 0) {
      const newPeriod = queryRunner.manager.create(BaseRatePeriod, {
        roomTypeId,
        startDate: newStartDate as any,
        endDate: newEndDate as any,
        price,
        uid
      })
      return [await queryRunner.manager.save(newPeriod)]
    }

    // LÓGICA INTELIGENTE: Analizar qué partes del rango realmente necesitan cambio
    const results: BaseRatePeriod[] = []
    const periodsToDelete: string[] = []
    const periodsToUpdate: Array<{id: string, updates: Partial<BaseRatePeriod>}> = []
    const periodsToCreate: Array<Partial<BaseRatePeriod>> = []
    
    // Determinar qué partes del rango nuevo necesitan ser insertadas
    const rangesToInsert: Array<{startDate: string, endDate: string}> = []
    let currentDate = newStartDate

    // Analizar cada período solapado para determinar qué partes cambiar
    for (const overlappingPeriod of overlappingPeriods) {
      const overlappingStart = overlappingPeriod.startDate.toString()
      const overlappingEnd = overlappingPeriod.endDate.toString()
      
      // Calcular intersección entre el nuevo período y el período existente
      const intersectionStart = newStartDate > overlappingStart ? newStartDate : overlappingStart
      const intersectionEnd = newEndDate < overlappingEnd ? newEndDate : overlappingEnd
      
      // Si no hay intersección válida, continuar
      if (intersectionStart > intersectionEnd) continue

      // CASO CLAVE: Si el precio es igual en la intersección, no modificar
      if (Number(overlappingPeriod.price) === Number(price)) {
        // Agregar rangos anteriores a la intersección si existen
        if (currentDate < intersectionStart) {
          rangesToInsert.push({
            startDate: currentDate,
            endDate: this.subtractDays(intersectionStart, 1)
          })
        }
        // Saltar la intersección porque ya tiene el precio correcto
        currentDate = this.addDays(intersectionEnd, 1)
        continue
      }

      // CASO: Precio diferente, necesitamos hacer split
      
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

      // 3. Manejar el período existente solapado
      
      // Si el período existente empieza antes de la intersección, acortarlo
      if (overlappingStart < intersectionStart) {
        periodsToUpdate.push({
          id: overlappingPeriod.id,
          updates: { endDate: this.subtractDays(intersectionStart, 1) as any }
        })
      } else {
        // Si no hay parte anterior, marcar para eliminar
        periodsToDelete.push(overlappingPeriod.id)
      }

      // Si el período existente continúa después de la intersección, crear resto
      if (overlappingEnd > intersectionEnd) {
        periodsToCreate.push({
          roomTypeId,
          startDate: this.addDays(intersectionEnd, 1) as any,
          endDate: overlappingEnd as any,
          price: overlappingPeriod.price,
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
    
    // 1. Eliminar períodos marcados
    for (const periodId of periodsToDelete) {
      await queryRunner.manager.delete(BaseRatePeriod, periodId)
    }

    // 2. Actualizar períodos que fueron parcialmente cubiertos
    for (const updateData of periodsToUpdate) {
      await queryRunner.manager.update(BaseRatePeriod, updateData.id, updateData.updates)
    }

    // 3. Crear períodos restantes después de los splits
    for (const createData of periodsToCreate) {
      const newPeriod = queryRunner.manager.create(BaseRatePeriod, createData)
      results.push(await queryRunner.manager.save(newPeriod))
    }

    // 4. Crear nuevos períodos solo donde realmente se necesita
    for (const rangeData of rangesToInsert) {
      if (rangeData.startDate <= rangeData.endDate) {
        const newPeriod = queryRunner.manager.create(BaseRatePeriod, {
          roomTypeId,
          startDate: rangeData.startDate as any,
          endDate: rangeData.endDate as any,
          price,
          uid
        })
        results.push(await queryRunner.manager.save(newPeriod))
      }
    }

    // 5. CONSOLIDACIÓN AUTOMÁTICA: Fusionar períodos consecutivos con el mismo precio
    // Esto evita fragmentación innecesaria después de múltiples operaciones de split
    await this.consolidateConsecutivePeriods(roomTypeId, queryRunner)
    
    // Retornar todos los períodos actualizados del roomType
    const finalPeriods = await queryRunner.manager
      .createQueryBuilder(BaseRatePeriod, 'brp')
      .where('brp.roomTypeId = :roomTypeId', { roomTypeId })
      .orderBy('brp.startDate', 'ASC')
      .getMany()

    return finalPeriods
  }
}