import { Inject, Injectable } from '@nestjs/common'
//import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { ContentBlock } from '../entities/content-block.entity'
import { repositories } from '../constants'
import { ContentBlockQueryDto } from '../dto'
import { PaginationDto } from '../../../common/dto/pagination.dto'

@Injectable()
export class ContentBlockRepository extends Repository<ContentBlock> {
  constructor(
    @Inject(repositories.CONTENT_BLOCK_REPOSITORY)
    private readonly _: Repository<ContentBlock>,
  ) {
    super(_.target, _.manager, _.queryRunner)
  }

  async findByFiltersPaginated(payload: ContentBlockQueryDto) {
    const { page, pageSize, search } = payload

    const pageNumber = page ?? 0
    const take = pageSize ?? 10
    const skip = Math.max(0, pageNumber) * take
    const query = this.createQueryBuilder('content_block')

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
