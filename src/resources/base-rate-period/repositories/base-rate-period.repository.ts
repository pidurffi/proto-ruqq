import { Inject, Injectable } from '@nestjs/common'
//import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'

import { BaseRatePeriod } from '../entities/base-rate-period.entity'
import { repositories } from '../constants'
import { BaseRatePeriodQueryDto } from '../dto'
import { PaginationDto } from '../../../common/dto/pagination.dto'
import { resources } from '../../../engine/database/constants'

@Injectable()
export class BaseRatePeriodRepository extends Repository<BaseRatePeriod> {
  constructor(
    @Inject(repositories.BASE_RATE_PERIOD_REPOSITORY)
    private readonly _: Repository<BaseRatePeriod>,
    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super(_.target, _.manager, _.queryRunner)
  }

  async findByFiltersPaginated(payload: BaseRatePeriodQueryDto) {
    const { page, pageSize, search } = payload

    const pageNumber = page ?? 0
    const take = pageSize ?? 10
    const skip = Math.max(0, pageNumber) * take
    const query = this.createQueryBuilder('base_rate_period')

    // if (fecha) {
    //   query.andWhere('p.fecha <= :fecha', {
    //     fecha,
    //   })
    // }

    // if (fechaDesde && fechaHasta) {
    //   query.andWhere('p.fecha between :fechaDesde and :fechaHasta', { fechaDesde, fechaHasta })
    // }

    const [data, total] = await query.take(take).skip(skip).getManyAndCount()

    return new PaginationDto({
      data,
      page,
      pageSize: take,
      lastPage: total ? Math.ceil(total / take) - 1 : 0,
      total,
    })
  }

  /**
   * Busca tipos de habitación válidos por capacidad máxima
   * @param pax Número de huéspedes
   * @returns Array de tipos de habitación válidos
   */
  async findValidRoomTypes(pax: number) {
    return await this.dataSource
      .getRepository('RoomType')
      .createQueryBuilder('rt')
      .where('rt.maxCapacity >= :pax', { pax })
      .orderBy('rt.maxCapacity', 'ASC')
      .getMany()
  }

  /**
   * Busca TODOS los tipos de habitación disponibles en el sistema
   * @returns Array de todos los tipos de habitación
   */
  async findAllRoomTypes() {
    return await this.dataSource
      .getRepository('RoomType')
      .createQueryBuilder('rt')
      .orderBy('rt.maxCapacity', 'ASC')
      .getMany()
  }

  /**
   * Busca períodos de tarifa relevantes para un tipo de habitación y rango de fechas
   * @param roomTypeId ID del tipo de habitación
   * @param checkIn Fecha de check-in
   * @param checkOut Fecha de check-out
   * @returns Array de períodos de tarifa relevantes
   */
  async findRelevantPeriods(roomTypeId: string, checkIn: string, checkOut: string) {
    return await this.createQueryBuilder('brp')
      .where('brp.roomTypeId = :roomTypeId', { roomTypeId })
      .andWhere('brp.startDate < :checkOut', { checkOut })
      .andWhere('brp.endDate >= :checkIn', { checkIn })
      .orderBy('brp.startDate', 'ASC')
      .getMany()
  }

  /**
   * Busca modificadores de ocupación para un período de tarifa específico
   * @param baseRatePeriodId ID del período de tarifa base
   * @returns Array de modificadores de ocupación
   */
  async findOccupancyModifiers(baseRatePeriodId: string) {
    return await this.dataSource
      .getRepository('OccupancyRateModifiers')
      .createQueryBuilder('orm')
      .where('orm.baseRatePeriodId = :baseRatePeriodId', { baseRatePeriodId })
      .getMany()
  }

  /**
   * Busca restricciones de estadía que afecten un tipo de habitación y rango de fechas
   * Ahora usa relaciones TypeORM en lugar de queries manuales
   * @param roomTypeId ID del tipo de habitación
   * @param checkIn Fecha de check-in
   * @param checkOut Fecha de check-out
   * @returns Array de restricciones aplicables con información del room type
   */
  async findApplicableRestrictions(roomTypeId: string, checkIn: string, checkOut: string) {
    return await this.dataSource
      .getRepository('Restrictions')
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.roomType', 'rt')  // ← Ahora usa relación TypeORM
      .where('r.roomTypeId = :roomTypeId', { roomTypeId })
      .andWhere('r.startDate <= :checkOut', { checkOut })
      .andWhere('r.endDate >= :checkIn', { checkIn })
      .getMany()
  }
}
