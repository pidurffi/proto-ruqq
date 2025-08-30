import { Inject, Injectable, BadRequestException } from '@nestjs/common'
import { DataSource, QueryRunner } from 'typeorm'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { BaseRatePeriod } from '../entities/base-rate-period.entity'
import { resources } from '../../../engine/database/constants'
import { BaseRatePeriodRepository } from '../repositories/base-rate-period.repository'
import { BaseRatePeriodQueryDto, BaseRatePeriodCreateDto, BaseRatePeriodBudgetDto, BudgetResponseDto, BudgetSegmentDto, RoomTypeBudgetDto } from '../dto'

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
   * para mantener la integridad de los datos sin solapamientos.
   * 
   * @param createBaseRatePeriodDto Datos del nuevo período de tarifa
   * @param uid ID del usuario que crea el registro
   * @returns Array de períodos de tarifa resultantes después del split
   */
  async createBaseRatePeriod(
    createBaseRatePeriodDto: BaseRatePeriodCreateDto,
    uid: string,
  ): Promise<BaseRatePeriod[]> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const result = await this.splitRateForPeriod(
        createBaseRatePeriodDto,
        uid,
        queryRunner
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
   * Calcula el presupuesto para una estadía basado en los períodos de tarifa.
   * Filtra por capacidad máxima y devuelve todos los tipos de habitación disponibles.
   * 
   * Flujo:
   * 1. Filtra tipos de habitación por max_capacity >= pax
   * 2. Para cada tipo válido, calcula el precio usando la estrategia de split
   * 3. Retorna array con todos los tipos disponibles y sus precios
   * 
   * @param budgetDto Datos de la consulta (pax, checkIn, checkOut)
   * @returns Presupuesto con todos los tipos de habitación disponibles
   */
  async calculateBudget(budgetDto: BaseRatePeriodBudgetDto): Promise<BudgetResponseDto> {
    const { pax, checkInDate, checkOutDate } = budgetDto
    const checkIn = checkInDate.toString()
    const checkOut = checkOutDate.toString()

    // Validación básica de fechas
    if (checkIn >= checkOut) {
      throw new BadRequestException('La fecha de check-in debe ser anterior a la fecha de check-out')
    }

    // 1. Filtrar tipos de habitación por capacidad máxima
    const validRoomTypes = await this.getRepository().findValidRoomTypes(pax)

    if (validRoomTypes.length === 0) {
      throw new BadRequestException(`No se encontraron tipos de habitación con capacidad para ${pax} huéspedes`)
    }

    // 2. Iterar por cada tipo de habitación válido y calcular su presupuesto
    const availableRoomTypes: RoomTypeBudgetDto[] = []

    for (const roomType of validRoomTypes) {
      // Buscar períodos de tarifa para este tipo de habitación
      const relevantPeriods = await this.getRepository().findRelevantPeriods(roomType.id, checkIn, checkOut)

      // Si no hay tarifas configuradas para este tipo, saltarlo
      if (relevantPeriods.length === 0) {
        continue
      }

      // Calcular segmentos y costos para este tipo de habitación
      const segments: BudgetSegmentDto[] = []
      let totalPrice = 0
      let totalNights = 0

      for (const period of relevantPeriods) {
        const periodStart = period.startDate.toString()
        const periodEnd = period.endDate.toString()

        // Calcular las fechas efectivas del segmento dentro de la estadía
        const segmentStart = checkIn > periodStart ? checkIn : periodStart
        const segmentEnd = checkOut <= periodEnd ? 
          this.subtractDays(checkOut, 1) : // Check-out no cuenta como noche
          periodEnd

        // Solo procesar si hay noches en este segmento
        if (segmentStart <= segmentEnd) {
          const nights = this.calculateNightsBetween(segmentStart, segmentEnd)
          let pricePerNight = Number(period.price)

          // Aplicar modificadores por ocupación si hay pasajeros extra
          if (pax > roomType.baseCapacity) {
            const extraPax = pax - roomType.baseCapacity
            const modifiers = await this.getRepository().findOccupancyModifiers(period.id)
            
            for (const modifier of modifiers) {
              if (modifier.modifierType === 'fixed') {
                // Precio fijo por pasajero extra
                pricePerNight += extraPax * Number(modifier.modifierValue)
              } else if (modifier.modifierType === 'percentage') {
                // Porcentaje sobre el precio base por pasajero extra
                const percentageIncrease = (Number(modifier.modifierValue) / 100) * Number(period.price)
                pricePerNight += extraPax * percentageIncrease
              }
            }
          }

          const subtotal = nights * pricePerNight

          segments.push({
            startDate: segmentStart,
            endDate: segmentEnd,
            pricePerNight: Math.round(pricePerNight * 100) / 100,
            nights,
            subtotal: Math.round(subtotal * 100) / 100
          })

          totalPrice += subtotal
          totalNights += nights
        }
      }

      // Agregar este tipo de habitación al resultado si tiene tarifas
      if (segments.length > 0) {
        availableRoomTypes.push({
          roomType: {
            id: roomType.id,
            name: roomType.name,
            code: roomType.code,
            baseCapacity: roomType.baseCapacity,
            maxCapacity: roomType.maxCapacity
          },
          totalNights,
          segments,
          totalPrice: Math.round(totalPrice * 100) / 100
        })
      }
    }

    return {
      pax,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      availableRoomTypes
    }
  }


  /**
   * Calcula el número de noches entre dos fechas (inclusive en ambos extremos)
   * @param startDate Fecha de inicio en formato YYYY-MM-DD
   * @param endDate Fecha de fin en formato YYYY-MM-DD
   * @returns Número de noches
   */
  private calculateNightsBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate + 'T00:00:00.000Z')
    const end = new Date(endDate + 'T00:00:00.000Z')
    const diffTime = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays + 1 // +1 porque ambas fechas son inclusivas
  }

  /**
   * Implementa la estrategia de "split" para períodos de tarifas.
   * 
   * Casos que maneja:
   * 1. Si existe un período que contiene completamente el nuevo rango con el mismo precio: NO hace nada
   * 2. Si hay solapamientos con precios diferentes: divide los períodos existentes
   * 3. Valida que startDate <= endDate
   * 
   * Ejemplo: [1-30 Sep $100] + [13-15 Sep $150] = [1-12 Sep $100] + [13-15 Sep $150] + [16-30 Sep $100]
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
      .getMany()

    // CASO 1: Si existe un período que contiene completamente el nuevo rango con el mismo precio
    // No hacemos nada para evitar fragmentación innecesaria
    for (const overlappingPeriod of overlappingPeriods) {
      const existingStart = overlappingPeriod.startDate.toString()
      const existingEnd = overlappingPeriod.endDate.toString()
      
      if (newStartDate >= existingStart && 
          newEndDate <= existingEnd && 
          Number(overlappingPeriod.price) === Number(price)) {
        return [overlappingPeriod] // Retorna sin cambios
      }
    }

    // CASO 2: Proceder con el split cuando hay precios diferentes
    const results: BaseRatePeriod[] = []
    const periodsToDelete: string[] = []
    const periodsToUpdate: Array<{id: string, updates: Partial<BaseRatePeriod>}> = []
    const periodsToCreate: Array<Partial<BaseRatePeriod>> = []

    // Procesar cada período solapado
    for (const overlappingPeriod of overlappingPeriods) {
      const overlappingStart = overlappingPeriod.startDate.toString()
      const overlappingEnd = overlappingPeriod.endDate.toString()

      // Si el precio es el mismo, no necesitamos cambiar este período
      if (Number(overlappingPeriod.price) === Number(price)) {
        continue
      }

      // CASO 2A: El nuevo período cubre completamente el período existente
      if (newStartDate <= overlappingStart && newEndDate >= overlappingEnd) {
        periodsToDelete.push(overlappingPeriod.id)
        continue
      }

      // CASO 2B: El nuevo período está en el medio del período existente
      if (newStartDate > overlappingStart) {
        // Acortar el período existente hasta antes del nuevo período
        periodsToUpdate.push({
          id: overlappingPeriod.id,
          updates: { endDate: this.subtractDays(newStartDate, 1) as any }
        })

        // Si el nuevo período no llega hasta el final, crear el período restante
        if (newEndDate < overlappingEnd) {
          periodsToCreate.push({
            roomTypeId,
            startDate: this.addDays(newEndDate, 1) as any,
            endDate: overlappingEnd as any,
            price: overlappingPeriod.price,
            uid
          })
        }
      } 
      // CASO 2C: El nuevo período empieza antes y termina dentro del período existente
      else if (newEndDate < overlappingEnd) {
        periodsToUpdate.push({
          id: overlappingPeriod.id,
          updates: { startDate: this.addDays(newEndDate, 1) as any }
        })
      }
    }

    // Ejecutar todas las operaciones de base de datos
    
    // 1. Eliminar períodos que fueron completamente cubiertos
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

    // 4. Crear el nuevo período si no está completamente cubierto por un período existente con el mismo precio
    const hasNewPeriodData = !overlappingPeriods.some(period => 
      Number(period.price) === Number(price) &&
      period.startDate.toString() <= newStartDate &&
      period.endDate.toString() >= newEndDate
    )

    if (hasNewPeriodData) {
      const newPeriod = queryRunner.manager.create(BaseRatePeriod, {
        roomTypeId,
        startDate: newStartDate as any,
        endDate: newEndDate as any,
        price,
        uid
      })
      results.push(await queryRunner.manager.save(newPeriod))
    }

    return results
  }
}
