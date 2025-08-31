import { Inject, Injectable } from '@nestjs/common'
//import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { QuoteGenerator } from '../entities/quote-generator.entity'
import { repositories } from '../constants'
import { QuoteGeneratorQueryDto } from '../dto'
import { PaginationDto } from '../../../common/dto/pagination.dto'

@Injectable()
export class QuoteGeneratorRepository extends Repository<QuoteGenerator> {
  constructor(
    @Inject(repositories.QUOTE_GENERATOR_REPOSITORY)
    private readonly _: Repository<QuoteGenerator>,
  ) {
    super(_.target, _.manager, _.queryRunner)
  }

  async findByFiltersPaginated(payload: QuoteGeneratorQueryDto) {
    const { page, pageSize, search } = payload

    const pageNumber = page ?? 0
    const take = pageSize ?? 10
    const skip = Math.max(0, pageNumber) * take
    const query = this.createQueryBuilder('quote_generator')

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

  /* 
  ejemplo
  public consultaPrueba() {
    return this.createQueryBuilder('bateria').getMany()
  } */
}
