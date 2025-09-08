import { Inject, Injectable } from '@nestjs/common'
import { Repository, DataSource, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm'

import { DailyRoomRate } from '../entities/daily-room-rate.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

/**
 * DailyRoomRatesRepository - Repositorio especializado para modelo OTA
 * 
 * OPTIMIZACIONES ESPECÍFICAS PARA CALENDARIO DIARIO:
 * - Queries por rangos de fechas (uso principal de OTAs)
 * - Bulk operations para carga masiva de temporadas
 * - Consultas de disponibilidad en tiempo real
 * - Compatible con tenant-aware multi-schema
 */
@Injectable()
export class DailyRoomRatesRepository extends Repository<DailyRoomRate> {
  constructor(
    @Inject(repositories.DAILY_ROOM_RATES_REPOSITORY)
    private readonly _: Repository<DailyRoomRate>,
    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super(_.target, _.manager, _.queryRunner)
  }

  //========================================
  // CONSULTAS OPTIMIZADAS - ESTILO OTA
  //========================================

  /**
   * Obtener tarifas para un rango de fechas (query principal para cotizaciones)
   * Equivale al XML de Booking.com: <roomrate date="..." price="..." />
   */
  async findRatesForPeriod(
    roomTypeId: string,
    startDate: string,
    endDate: string,
    onlyActive: boolean = true
  ): Promise<DailyRoomRate[]> {
    const query = this.createQueryBuilder('rate')
      .where('rate.roomTypeId = :roomTypeId', { roomTypeId })
      .andWhere('rate.date >= :startDate', { startDate })
      .andWhere('rate.date <= :endDate', { endDate })
      .orderBy('rate.date', 'ASC')

    if (onlyActive) {
      query.andWhere('rate.isActive = true')
    }

    return query.getMany()
  }

  /**
   * Obtener tarifas con disponibilidad para cotizaciones
   * Solo días que tienen habitaciones disponibles
   */
  async findAvailableRatesForPeriod(
    roomTypeId: string,
    startDate: string,
    endDate: string,
    minRooms: number = 1
  ): Promise<DailyRoomRate[]> {
    return this.createQueryBuilder('rate')
      .where('rate.roomTypeId = :roomTypeId', { roomTypeId })
      .andWhere('rate.date >= :startDate', { startDate })
      .andWhere('rate.date <= :endDate', { endDate })
      .andWhere('rate.isActive = true')
      .andWhere('rate.availableRooms >= :minRooms', { minRooms })
      .andWhere('rate.closedToArrival = false')
      .orderBy('rate.date', 'ASC')
      .getMany()
  }

  /**
   * Verificar disponibilidad para una fecha específica
   * Para validaciones rápidas de reservas
   */
  async findRateForDate(
    roomTypeId: string,
    date: string
  ): Promise<DailyRoomRate | null> {
    return this.findOne({
      where: {
        roomTypeId,
        date: new Date(date),
        isActive: true
      }
    })
  }

  /**
   * Obtener estadísticas de ocupación para un período
   * Para dashboards y reportes
   */
  async getOccupancyStats(
    roomTypeId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalDays: number
    availableDays: number
    avgRate: number
    totalInventory: number
  }> {
    const result = await this.createQueryBuilder('rate')
      .select([
        'COUNT(*) as totalDays',
        'SUM(CASE WHEN rate.availableRooms > 0 THEN 1 ELSE 0 END) as availableDays',
        'AVG(rate.baseRate) as avgRate',
        'SUM(rate.availableRooms) as totalInventory'
      ])
      .where('rate.roomTypeId = :roomTypeId', { roomTypeId })
      .andWhere('rate.date >= :startDate', { startDate })
      .andWhere('rate.date <= :endDate', { endDate })
      .andWhere('rate.isActive = true')
      .getRawOne()

    return {
      totalDays: parseInt(result.totalDays) || 0,
      availableDays: parseInt(result.availableDays) || 0,
      avgRate: parseFloat(result.avgRate) || 0,
      totalInventory: parseInt(result.totalInventory) || 0
    }
  }

  //========================================
  // OPERACIONES BULK - PARA TEMPORADAS
  //========================================

  /**
   * Insertar o actualizar múltiples tarifas (UPSERT)
   * Para cargas masivas de temporadas o actualizaciones de Channel Manager
   */
  async upsertRates(rates: Partial<DailyRoomRate>[]): Promise<void> {
    if (rates.length === 0) return

    await this.createQueryBuilder()
      .insert()
      .into(DailyRoomRate)
      .values(rates)
      .orUpdate(['baseRate', 'availableRooms', 'isActive', 'updatedAt'], ['roomTypeId', 'date'])
      .execute()
  }

  /**
   * Actualizar precios en bulk para un rango
   * Para aplicar aumentos de temporada, descuentos, etc.
   */
  async updateRatesForPeriod(
    roomTypeId: string,
    startDate: string,
    endDate: string,
    updates: Partial<Pick<DailyRoomRate, 'baseRate' | 'availableRooms' | 'isActive'>>
  ): Promise<void> {
    await this.createQueryBuilder()
      .update(DailyRoomRate)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where('roomTypeId = :roomTypeId', { roomTypeId })
      .andWhere('date >= :startDate', { startDate })
      .andWhere('date <= :endDate', { endDate })
      .execute()
  }

  /**
   * Eliminar tarifas para un rango (soft delete)
   * Para limpiar datos antiguos o cerrar períodos
   */
  async deleteRatesForPeriod(
    roomTypeId: string,
    startDate: string,
    endDate: string
  ): Promise<void> {
    await this.createQueryBuilder()
      .softDelete()
      .where('roomTypeId = :roomTypeId', { roomTypeId })
      .andWhere('date >= :startDate', { startDate })
      .andWhere('date <= :endDate', { endDate })
      .execute()
  }

  //========================================
  // UTILIDADES DE FECHAS
  //========================================

  /**
   * Generar fechas faltantes para un rango
   * Para asegurar continuidad en el calendario
   */
  async findMissingDatesInRange(
    roomTypeId: string,
    startDate: string,
    endDate: string
  ): Promise<Date[]> {
    const existingRates = await this.findRatesForPeriod(roomTypeId, startDate, endDate, false)
    const existingDates = new Set(
      existingRates.map(rate => rate.date.toISOString().split('T')[0])
    )

    const missingDates: Date[] = []
    const current = new Date(startDate)
    const end = new Date(endDate)

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      if (!existingDates.has(dateStr)) {
        missingDates.push(new Date(dateStr))
      }
      current.setDate(current.getDate() + 1)
    }

    return missingDates
  }

  /**
   * Obtener todos los room types disponibles
   * Para generar matriz de precios
   */
  async findAllRoomTypes(): Promise<any[]> {
    return this.query(`
      SELECT DISTINCT rt.id, rt.name, rt.code, rt.base_capacity, rt.max_capacity
      FROM room_type rt
      WHERE rt.deleted_at IS NULL
      ORDER BY rt.name
    `)
  }
}