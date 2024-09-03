import { BadRequestException, Inject, Injectable } from '@nestjs/common'
//import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Banner } from '../entities/banner.entity'
import { repositories } from '../constants'
import { BannerQueryDto } from '../dto/banner.dto'
import { PaginationDto } from '../../../common'

@Injectable()
export class BannerRepository extends Repository<Banner> {
  constructor(@Inject(repositories.BANNER_REPOSITORY) private readonly _: Repository<Banner>) {
    super(_.target, _.manager, _.queryRunner)
  }

  async findByFiltersPaginated(payload: BannerQueryDto) {
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

  private createBaseQuery() {
    return this.createQueryBuilder('banner')
      .select('banner.id')
      .addSelect('banner.title')
      .addSelect('banner.subtitle')
      .addSelect('banner.description')
      .addSelect('banner.imgPath')
      .addSelect('banner.thumbPath')
      .addSelect('banner.order')
      .addSelect('banner.enabled')
      .addSelect('banner.buttonEnabled')
      .addSelect('banner.buttonText')
      .addSelect('banner.buttonLink')
      .addSelect('banner.dateIn')
      .addSelect('banner.dateOut')
      .addSelect('banner.isPromo')
      .orderBy('banner.createdAt', 'DESC')
  }

  async getAllBanners(): Promise<Banner[]> {
    return this.createBaseQuery().getMany()
  }

  async getBannerById(id: string): Promise<Banner> {
    const banner = await this.createBaseQuery().where('banner.id = :id', { id }).getOne()
    if (!banner) {
      throw new BadRequestException(Banner, id)
    }
    return banner
  }

  async getBannersByFilter(cant: number) {
    const banners = await this.createBaseQuery()
      .andWhere('CURRENT_DATE >= banner.dateIn AND CURRENT_DATE <= banner.dateOut')
      .orderBy('banner.order', 'ASC')
      .limit(cant)
      .getMany()

    return banners
  }
}
