import { Inject, Injectable } from '@nestjs/common'
import { Repository, DataSource } from 'typeorm'

import { PriceRule } from '../entities/price-rules.entity'
import { repositories } from '../constants'
import { resources } from '../../../engine/database/constants'
import { PriceRulesQueryDto } from '../dto'
import { PaginationDto } from '../../../common/dto/pagination.dto'

@Injectable()
export class PriceRulesRepository extends Repository<PriceRule> {
  constructor(
    @Inject(repositories.PRICE_RULES_REPOSITORY)
    private readonly _: Repository<PriceRule>,
    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super(_.target, _.manager, _.queryRunner)
  }

  async findByFiltersPaginated(payload: PriceRulesQueryDto) {
    const { page, pageSize, search } = payload

    const pageNumber = page ?? 0
    const take = pageSize ?? 10
    const skip = Math.max(0, pageNumber) * take
    const query = this.createQueryBuilder('pr')
      .leftJoinAndSelect('pr.roomType', 'rt')

    if (search) {
      query.andWhere('rt.name ILIKE :search OR rt.code ILIKE :search', {
        search: `%${search}%`,
      })
    }

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
   * Busca la regla de mayor prioridad que aplique para una fecha y día específicos
   */
  async findApplicableRule(roomTypeId: string, date: Date): Promise<PriceRule | null> {
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay() // Convertir domingo de 0 a 7 (ISO 8601)
    
    return await this.createQueryBuilder('pr')
      .where('pr.roomTypeId = :roomTypeId', { roomTypeId })
      .andWhere('pr.startDate <= :date', { date })
      .andWhere('pr.endDate >= :date', { date })
      .andWhere(':dayOfWeek = ANY(pr.daysOfWeek)', { dayOfWeek })
      .orderBy('pr.priority', 'DESC')
      .getOne()
  }

  /**
   * Busca reglas que se superponen con el rango de fechas dado para un tipo de habitación
   */
  async findOverlappingRules(
    roomTypeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PriceRule[]> {
    return await this.createQueryBuilder('pr')
      .where('pr.roomTypeId = :roomTypeId', { roomTypeId })
      .andWhere(
        '(pr.startDate <= :endDate AND pr.endDate >= :startDate)',
        { startDate, endDate }
      )
      .orderBy('pr.startDate', 'ASC')
      .addOrderBy('pr.priority', 'DESC')
      .getMany()
  }
}
