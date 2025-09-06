import { Inject, Injectable, BadRequestException } from '@nestjs/common'
import { DataSource, QueryRunner } from 'typeorm'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { Restrictions } from '../entities/restrictions.entity'
import { resources } from '../../../engine/database/constants'
import { RestrictionsRepository } from '../repositories/restrictions.repository'
import { RestrictionsQueryDto, RestrictionsCreateDto } from '../dto'

/**
 * RestrictionsService - Servicio CRUD para restricciones con estrategia de split y optimización
 * 
 * RESPONSABILIDAD ÚNICA (SRP):
 * - Se encarga de operaciones CRUD y la estrategia de "split" para restrictions
 * - Maneja consolidación automática de restricciones consecutivas idénticas
 * - Considera todos los campos de restricción para determinar conflictos
 * 
 * STRATEGY PATTERN:
 * - Implementa estrategia de "split" considerando todos los campos de la restricción
 * - Mantiene integridad referencial en restricciones solapadas con diferentes parámetros
 */
@Injectable()
export class RestrictionsService extends BaseEntityService<Restrictions> {
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
   * Verifica si dos restricciones son idénticas en todos los campos relevantes para consolidación
   * @param restriction1 Primera restricción
   * @param restriction2 Segunda restricción
   * @returns true si todas las propiedades de negocio son iguales
   */
  private areRestrictionsIdentical(restriction1: Restrictions, restriction2: Restrictions): boolean {
    return (
      restriction1.roomTypeId === restriction2.roomTypeId &&
      restriction1.minLengthOfStay === restriction2.minLengthOfStay &&
      restriction1.maxLengthOfStay === restriction2.maxLengthOfStay &&
      restriction1.closedToArrival === restriction2.closedToArrival &&
      restriction1.closedToDeparture === restriction2.closedToDeparture
    )
  }
  constructor(
    @Inject(RestrictionsRepository)
    private readonly repository: RestrictionsRepository,
    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super()
  }

  protected getRepository(): RestrictionsRepository {
    return this.repository
  }

  /**
   * Crea una nueva restricción usando la estrategia de "split".
   * Si existe una restricción solapada con diferentes parámetros, divide las restricciones existentes
   * para mantener la consistencia de datos sin conflictos.
   * 
   * STRATEGY PATTERN:
   * - Implementa la estrategia de división considerando todos los campos de la restricción
   * - Utiliza transacciones para garantizar atomicidad
   * 
   * @param createRestrictionsDto - Los datos para crear la restricción
   * @param uid - ID del usuario que crea el registro
   * @returns Array de restricciones resultantes después del split
   */
  async createRestrictions(
    createRestrictionsDto: RestrictionsCreateDto,
    uid: string,
  ): Promise<Restrictions[]> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const result = await this.splitRestrictionForPeriod(
        createRestrictionsDto,
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

  async findAllWithFilterPaginated(payload: RestrictionsQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }

  /**
   * Consolida restricciones consecutivas idénticas para evitar fragmentación.
   * 
   * Busca restricciones del mismo roomTypeId que sean idénticas en todos los campos
   * y tengan períodos consecutivos, fusionándolas en una sola restricción.
   * 
   * @param roomTypeId ID del tipo de habitación
   * @param queryRunner Instancia de QueryRunner para transacciones
   * @returns Array de restricciones consolidadas
   */
  private async consolidateConsecutiveRestrictions(
    roomTypeId: string,
    queryRunner: QueryRunner
  ): Promise<Restrictions[]> {
    // Obtener todas las restricciones del roomType ordenadas por fecha de inicio
    const allRestrictions = await queryRunner.manager
      .createQueryBuilder(Restrictions, 'r')
      .where('r.roomTypeId = :roomTypeId', { roomTypeId })
      .orderBy('r.startDate', 'ASC')
      .addOrderBy('r.endDate', 'ASC')
      .getMany()

    if (allRestrictions.length <= 1) {
      return allRestrictions
    }

    const consolidatedRestrictions: Restrictions[] = []
    const restrictionsToDelete: string[] = []
    
    let currentGroup = [allRestrictions[0]]

    for (let i = 1; i < allRestrictions.length; i++) {
      const current = allRestrictions[i]
      const lastInGroup = currentGroup[currentGroup.length - 1]

      // Verificar si la restricción actual es consecutiva e idéntica
      const lastEndDate = lastInGroup.endDate.toString()
      const currentStartDate = current.startDate.toString()
      const nextDayAfterLast = this.addDays(lastEndDate, 1)
      
      const isConsecutive = currentStartDate === nextDayAfterLast
      const areIdentical = this.areRestrictionsIdentical(lastInGroup, current)

      if (isConsecutive && areIdentical) {
        // Agregar al grupo actual para consolidación
        currentGroup.push(current)
      } else {
        // Procesar el grupo actual y empezar uno nuevo
        if (currentGroup.length > 1) {
          // Consolidar el grupo
          const consolidated = await this.consolidateRestrictionGroup(currentGroup, queryRunner)
          consolidatedRestrictions.push(consolidated)
          
          // Marcar restricciones del grupo para eliminación (excepto la primera que se actualizó)
          for (let j = 1; j < currentGroup.length; j++) {
            restrictionsToDelete.push(currentGroup[j].id)
          }
        } else {
          // El grupo tiene solo una restricción, mantenerla tal como está
          consolidatedRestrictions.push(currentGroup[0])
        }
        
        // Empezar nuevo grupo
        currentGroup = [current]
      }
    }

    // Procesar el último grupo
    if (currentGroup.length > 1) {
      const consolidated = await this.consolidateRestrictionGroup(currentGroup, queryRunner)
      consolidatedRestrictions.push(consolidated)
      
      for (let j = 1; j < currentGroup.length; j++) {
        restrictionsToDelete.push(currentGroup[j].id)
      }
    } else {
      consolidatedRestrictions.push(currentGroup[0])
    }

    // Eliminar restricciones redundantes
    for (const restrictionId of restrictionsToDelete) {
      await queryRunner.manager.delete(Restrictions, restrictionId)
    }

    return consolidatedRestrictions
  }

  /**
   * Consolida un grupo de restricciones consecutivas idénticas en una sola.
   * 
   * @param group Array de restricciones consecutivas idénticas
   * @param queryRunner Instancia de QueryRunner para transacciones
   * @returns Restricción consolidada resultante
   */
  private async consolidateRestrictionGroup(
    group: Restrictions[],
    queryRunner: QueryRunner
  ): Promise<Restrictions> {
    if (group.length === 0) {
      throw new Error('El grupo no puede estar vacío')
    }

    if (group.length === 1) {
      return group[0]
    }

    // Tomar la primera restricción como base y extender su fecha de fin
    const firstRestriction = group[0]
    const lastRestriction = group[group.length - 1]

    // Actualizar la primera restricción para que cubra todo el rango
    await queryRunner.manager.update(Restrictions, firstRestriction.id, {
      endDate: lastRestriction.endDate
    })

    // Obtener la restricción actualizada
    const updatedRestriction = await queryRunner.manager.findOne(Restrictions, {
      where: { id: firstRestriction.id }
    })

    return updatedRestriction || firstRestriction
  }

  /**
   * Implementa la estrategia de "split" inteligente para restricciones.
   * 
   * LÓGICA INTELIGENTE:
   * - Solo modifica restricciones donde los parámetros realmente cambian
   * - Analiza cada restricción solapada para determinar qué partes necesitan cambio
   * - Evita splits innecesarios cuando todos los campos ya son iguales
   * 
   * @param createDto Datos de la restricción a insertar
   * @param uid ID del usuario
   * @param queryRunner Instancia de QueryRunner para transacciones
   * @returns Array de restricciones resultantes
   */
  private async splitRestrictionForPeriod(
    createDto: RestrictionsCreateDto,
    uid: string,
    queryRunner: QueryRunner
  ): Promise<Restrictions[]> {
    const { roomTypeId, startDate, endDate, minLengthOfStay, maxLengthOfStay, closedToArrival, closedToDeparture } = createDto
    const newStartDate = startDate.toString()
    const newEndDate = endDate.toString()

    // Validación básica de fechas
    if (newStartDate > newEndDate) {
      throw new BadRequestException('La fecha de inicio no puede ser mayor que la fecha de fin')
    }

    // Buscar restricciones que se solapan con el nuevo rango
    const overlappingRestrictions = await queryRunner.manager
      .createQueryBuilder(Restrictions, 'r')
      .where('r.roomTypeId = :roomTypeId', { roomTypeId })
      .andWhere('r.startDate <= :endDate', { endDate: newEndDate })
      .andWhere('r.endDate >= :startDate', { startDate: newStartDate })
      .orderBy('r.startDate', 'ASC')
      .getMany()

    // Si no hay restricciones solapadas, crear directamente
    if (overlappingRestrictions.length === 0) {
      const newRestriction = queryRunner.manager.create(Restrictions, {
        roomTypeId,
        startDate: newStartDate as any,
        endDate: newEndDate as any,
        minLengthOfStay,
        maxLengthOfStay,
        closedToArrival: closedToArrival ?? false,
        closedToDeparture: closedToDeparture ?? false,
        uid
      })
      return [await queryRunner.manager.save(newRestriction)]
    }

    // LÓGICA INTELIGENTE: Analizar qué partes del rango realmente necesitan cambio
    const results: Restrictions[] = []
    const restrictionsToDelete: string[] = []
    const restrictionsToUpdate: Array<{id: string, updates: Partial<Restrictions>}> = []
    const restrictionsToCreate: Array<Partial<Restrictions>> = []
    
    // Determinar qué partes del rango nuevo necesitan ser insertadas
    const rangesToInsert: Array<{startDate: string, endDate: string}> = []
    let currentDate = newStartDate

    // Analizar cada restricción solapada para determinar qué partes cambiar
    for (const overlappingRestriction of overlappingRestrictions) {
      const overlappingStart = overlappingRestriction.startDate.toString()
      const overlappingEnd = overlappingRestriction.endDate.toString()
      
      // Calcular intersección entre la nueva restricción y la restricción existente
      const intersectionStart = newStartDate > overlappingStart ? newStartDate : overlappingStart
      const intersectionEnd = newEndDate < overlappingEnd ? newEndDate : overlappingEnd
      
      // Si no hay intersección válida, continuar
      if (intersectionStart > intersectionEnd) continue

      // CASO CLAVE: Si TODOS los campos son iguales en la intersección, no modificar
      const newRestrictionData = {
        roomTypeId,
        minLengthOfStay,
        maxLengthOfStay,
        closedToArrival: closedToArrival ?? false,
        closedToDeparture: closedToDeparture ?? false
      }
      
      const existingRestrictionData = {
        roomTypeId: overlappingRestriction.roomTypeId,
        minLengthOfStay: overlappingRestriction.minLengthOfStay,
        maxLengthOfStay: overlappingRestriction.maxLengthOfStay,
        closedToArrival: overlappingRestriction.closedToArrival,
        closedToDeparture: overlappingRestriction.closedToDeparture
      }

      const areAllFieldsIdentical = (
        newRestrictionData.roomTypeId === existingRestrictionData.roomTypeId &&
        newRestrictionData.minLengthOfStay === existingRestrictionData.minLengthOfStay &&
        newRestrictionData.maxLengthOfStay === existingRestrictionData.maxLengthOfStay &&
        newRestrictionData.closedToArrival === existingRestrictionData.closedToArrival &&
        newRestrictionData.closedToDeparture === existingRestrictionData.closedToDeparture
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

      // 3. Manejar la restricción existente solapada
      
      // Si la restricción existente empieza antes de la intersección, acortarla
      if (overlappingStart < intersectionStart) {
        restrictionsToUpdate.push({
          id: overlappingRestriction.id,
          updates: { endDate: this.subtractDays(intersectionStart, 1) as any }
        })
      } else {
        // Si no hay parte anterior, marcar para eliminar
        restrictionsToDelete.push(overlappingRestriction.id)
      }

      // Si la restricción existente continúa después de la intersección, crear resto
      if (overlappingEnd > intersectionEnd) {
        restrictionsToCreate.push({
          roomTypeId,
          startDate: this.addDays(intersectionEnd, 1) as any,
          endDate: overlappingEnd as any,
          minLengthOfStay: overlappingRestriction.minLengthOfStay,
          maxLengthOfStay: overlappingRestriction.maxLengthOfStay,
          closedToArrival: overlappingRestriction.closedToArrival,
          closedToDeparture: overlappingRestriction.closedToDeparture,
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
    
    // 1. Eliminar restricciones marcadas
    for (const restrictionId of restrictionsToDelete) {
      await queryRunner.manager.delete(Restrictions, restrictionId)
    }

    // 2. Actualizar restricciones que fueron parcialmente cubiertas
    for (const updateData of restrictionsToUpdate) {
      await queryRunner.manager.update(Restrictions, updateData.id, updateData.updates)
    }

    // 3. Crear restricciones restantes después de los splits
    for (const createData of restrictionsToCreate) {
      const newRestriction = queryRunner.manager.create(Restrictions, createData)
      results.push(await queryRunner.manager.save(newRestriction))
    }

    // 4. Crear nuevas restricciones solo donde realmente se necesita
    for (const rangeData of rangesToInsert) {
      if (rangeData.startDate <= rangeData.endDate) {
        const newRestriction = queryRunner.manager.create(Restrictions, {
          roomTypeId,
          startDate: rangeData.startDate as any,
          endDate: rangeData.endDate as any,
          minLengthOfStay,
          maxLengthOfStay,
          closedToArrival: closedToArrival ?? false,
          closedToDeparture: closedToDeparture ?? false,
          uid
        })
        results.push(await queryRunner.manager.save(newRestriction))
      }
    }

    // 5. CONSOLIDACIÓN AUTOMÁTICA: Fusionar restricciones consecutivas idénticas
    // Esto evita fragmentación innecesaria después de múltiples operaciones de split
    await this.consolidateConsecutiveRestrictions(roomTypeId, queryRunner)
    
    // Retornar todas las restricciones actualizadas del roomType
    const finalRestrictions = await queryRunner.manager
      .createQueryBuilder(Restrictions, 'r')
      .where('r.roomTypeId = :roomTypeId', { roomTypeId })
      .orderBy('r.startDate', 'ASC')
      .getMany()

    return finalRestrictions
  }

  /**
   * Busca la restricción aplicable para una fecha y room type específicos
   */
  async findApplicableRestriction(roomTypeId: string, date: Date): Promise<Restrictions | null> {
    const dateString = date.toISOString().split('T')[0]
    return await this.repository.createQueryBuilder('r')
      .where('r.roomTypeId = :roomTypeId', { roomTypeId })
      .andWhere('r.startDate <= :date', { date: dateString })
      .andWhere('r.endDate >= :date', { date: dateString })
      .getOne()
  }

  /**
   * Verifica si una restricción permite check-in para una fecha específica
   */
  canCheckIn(restriction: Restrictions | null): boolean {
    if (!restriction) return true
    return !restriction.closedToArrival
  }

  /**
   * Verifica si una restricción permite check-out para una fecha específica
   */
  canCheckOut(restriction: Restrictions | null): boolean {
    if (!restriction) return true
    return !restriction.closedToDeparture
  }

  /**
   * Verifica si una estancia cumple con las restricciones de duración mínima/máxima
   */
  isStayLengthValid(restriction: Restrictions | null, stayLength: number): boolean {
    if (!restriction) return true
    
    if (restriction.minLengthOfStay && stayLength < restriction.minLengthOfStay) {
      return false
    }
    
    if (restriction.maxLengthOfStay && stayLength > restriction.maxLengthOfStay) {
      return false
    }
    
    return true
  }
}
