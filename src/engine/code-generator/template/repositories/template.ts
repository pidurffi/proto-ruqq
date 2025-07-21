import { Inject, Injectable } from '@nestjs/common'
//import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Template } from '../entities/template'
import { repositories } from '../constants'
import { TemplateQueryDto } from '../dto'
import { PaginationDto } from '../../../../common/dto/pagination.dto'

@Injectable()
export class TemplateRepository extends Repository<Template> {
  constructor(
    @Inject(repositories.TEMPLATE_REPOSITORY)
    private readonly _: Repository<Template>,
  ) {
    super(_.target, _.manager, _.queryRunner)
  }

  async findByFiltersPaginated(payload: TemplateQueryDto) {
    const { page, pageSize, search } = payload

    const pageNumber = page ?? 0
    const take = pageSize ?? 10
    const skip = Math.max(0, pageNumber) * take
    const query = this.createQueryBuilder('template')

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
