import { Inject, Injectable } from '@nestjs/common'
//import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { SectionImg } from '../entities/section-img.entity'
import { repositories } from '../constants'
import { SectionImgQueryDto } from '../dto/section-img.dto'
import { PaginationDto } from '../../../common'

@Injectable()
export class SectionImgRepository extends Repository<SectionImg> {
  constructor(@Inject(repositories.SECTIONIMG_REPOSITORY) private readonly _: Repository<SectionImg>) {
    super(_.target, _.manager, _.queryRunner)
  }

  async findByFiltersPaginated(payload: SectionImgQueryDto) {
    const { page, pageSize, sortBy, sortOrder } = payload

    const pageNumber = page ?? 0
    const take = pageSize ?? 10
    const skip = Math.max(0, pageNumber) * take
    const query = this.createQueryBuilder('template')

    if (sortBy && sortOrder) {
      let sortByColumn = sortBy
      const column = this.metadata?.columns?.find(column => column.propertyName === sortByColumn)
      if (!column) sortByColumn = 'id'
      const order = sortOrder.toString() as 'ASC' | 'DESC'
      query.orderBy(`template.${sortBy}`, order)
    }
    const data = await query.take(take).skip(skip).getMany()
    const total = await query.getCount()

    return new PaginationDto({
      data,
      page,
      pageSize: take,
      lastPage: total ? Math.ceil(total / take) - 1 : 0,
      total,
    })
  }
}
