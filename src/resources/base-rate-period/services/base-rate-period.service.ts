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
   * Método auxiliar para crear un período de tarifa base
   * Centraliza la creación para evitar duplicación de código
   */
  private async createPeriod(
    queryRunner: QueryRunner, 
    periodData: {
      roomTypeId: string,
      startDate: string,
      endDate: string,
      price: number,
      uid: string
    }
  ): Promise<BaseRatePeriod> {
    const period = queryRunner.manager.create(BaseRatePeriod, {
      roomTypeId: periodData.roomTypeId,
      startDate: periodData.startDate as any,
      endDate: periodData.endDate as any,
      price: periodData.price,
      uid: periodData.uid
    })
    return await queryRunner.manager.save(period)
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
   * ALGORITMO SIMPLE DESDE CERO - BaseRatePeriod
   * 
   * LÓGICA CLARA (igual que PriceRules):
   * 1. Buscar períodos que se solapan con el nuevo
   * 2. Eliminar TODOS los períodos solapados
   * 3. Por cada período eliminado, crear fragmentos que NO se solapan
   * 4. Crear el nuevo período
   * 5. NO consolidación automática (mantener simple)
   * 
   * DIFERENCIA vs PriceRules: 
   * - Solo compara 'price' (más simple que múltiples campos)
   * - NO tiene "fragmento durante" (sin daysOfWeek)
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
    const newStart = startDate.toString()
    const newEnd = endDate.toString()

    // Validación básica
    if (newStart > newEnd) {
      throw new BadRequestException('La fecha de inicio no puede ser mayor que la fecha de fin')
    }

    // PASO 1: Buscar todos los períodos que se solapan
    const overlapping = await queryRunner.manager
      .createQueryBuilder(BaseRatePeriod, 'brp')
      .where('brp.roomTypeId = :roomTypeId', { roomTypeId })
      .andWhere('brp.startDate <= :endDate', { endDate: newEnd })
      .andWhere('brp.endDate >= :startDate', { startDate: newStart })
      .getMany()

    // PASO 2: Eliminar TODOS los períodos solapados
    for (const period of overlapping) {
      await queryRunner.manager.delete(BaseRatePeriod, period.id)
    }

    // PASO 3: Crear fragmentos de los períodos eliminados que NO se solapan
    for (const oldPeriod of overlapping) {
      const oldStart = oldPeriod.startDate.toString()
      const oldEnd = oldPeriod.endDate.toString()

      // FRAGMENTO ANTES: Si el período antiguo empezaba antes que el nuevo
      if (oldStart < newStart) {
        await this.createPeriod(queryRunner, {
          roomTypeId: oldPeriod.roomTypeId,
          startDate: oldStart,
          endDate: this.subtractDays(newStart, 1),
          price: oldPeriod.price,
          uid
        })
      }

      // FRAGMENTO DESPUÉS: Si el período antiguo terminaba después que el nuevo  
      if (oldEnd > newEnd) {
        await this.createPeriod(queryRunner, {
          roomTypeId: oldPeriod.roomTypeId,
          startDate: this.addDays(newEnd, 1),
          endDate: oldEnd,
          price: oldPeriod.price,
          uid
        })
      }

      // NO hay "fragmento durante" en BaseRatePeriod (sin daysOfWeek)
    }

    // PASO 4: Crear el nuevo período (UNA SOLA VEZ)
    await this.createPeriod(queryRunner, {
      roomTypeId,
      startDate: newStart,
      endDate: newEnd,
      price,
      uid
    })

    // PASO 5: Consolidar períodos consecutivos con mismo precio
    await this.consolidateConsecutivePeriods(queryRunner, roomTypeId, uid)

    // PASO 6: Retornar todos los períodos del roomType
    return await queryRunner.manager
      .createQueryBuilder(BaseRatePeriod, 'brp')
      .where('brp.roomTypeId = :roomTypeId', { roomTypeId })
      .orderBy('brp.startDate', 'ASC')
      .getMany()
  }

  /**
   * CONSOLIDACIÓN: Une períodos consecutivos con el mismo precio
   * 
   * LÓGICA SIMPLE:
   * 1. Buscar todos los períodos del roomType ordenados por fecha
   * 2. Agrupar períodos consecutivos con mismo precio
   * 3. Eliminar períodos fragmentados
   * 4. Crear un solo período consolidado por grupo
   */
  private async consolidateConsecutivePeriods(
    queryRunner: QueryRunner,
    roomTypeId: string,
    uid: string
  ): Promise<void> {
    // PASO 1: Obtener todos los períodos ordenados
    const periods = await queryRunner.manager
      .createQueryBuilder(BaseRatePeriod, 'brp')
      .where('brp.roomTypeId = :roomTypeId', { roomTypeId })
      .orderBy('brp.startDate', 'ASC')
      .getMany()

    if (periods.length <= 1) return // No hay nada que consolidar

    // PASO 2: Agrupar períodos consecutivos con mismo precio
    const groups: BaseRatePeriod[][] = []
    let currentGroup = [periods[0]]

    for (let i = 1; i < periods.length; i++) {
      const current = periods[i]
      const previous = periods[i - 1]

      // Verificar si son consecutivos y mismo precio
      const isConsecutive = this.addDays(previous.endDate.toString(), 1) === current.startDate.toString()
      const samePrice = Number(previous.price) === Number(current.price)

      if (isConsecutive && samePrice) {
        // Agregar al grupo actual
        currentGroup.push(current)
      } else {
        // Cerrar grupo actual y empezar nuevo
        groups.push(currentGroup)
        currentGroup = [current]
      }
    }
    groups.push(currentGroup) // Agregar último grupo

    // PASO 3: Eliminar todos los períodos existentes
    for (const period of periods) {
      await queryRunner.manager.delete(BaseRatePeriod, period.id)
    }

    // PASO 4: Crear períodos consolidados
    for (const group of groups) {
      if (group.length === 0) continue

      const startDate = group[0].startDate.toString()
      const endDate = group[group.length - 1].endDate.toString()
      const price = group[0].price

      await this.createPeriod(queryRunner, {
        roomTypeId,
        startDate,
        endDate,
        price,
        uid
      })
    }
  }
}