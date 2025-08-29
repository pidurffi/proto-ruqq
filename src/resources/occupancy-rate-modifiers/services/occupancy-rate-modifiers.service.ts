import { Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { OccupancyRateModifiers } from '../entities/occupancy-rate-modifiers.entity'
import { resources } from '../../../engine/database/constants'
import { OccupancyRateModifiersRepository } from '../repositories/occupancy-rate-modifiers.repository'
import { OccupancyRateModifiersQueryDto, OccupancyRateModifiersCreateDto } from '../dto'

@Injectable()
export class OccupancyRateModifiersService extends BaseEntityService<OccupancyRateModifiers> {
  constructor(
    @Inject(OccupancyRateModifiersRepository)
    private readonly repository: OccupancyRateModifiersRepository,
    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super()
  }

  protected getRepository(): OccupancyRateModifiersRepository {
    return this.repository
  }

  async createOccupancyRateModifiers(
    createOccupancyRateModifiersDto: OccupancyRateModifiersCreateDto,
    uid: string,
  ): Promise<OccupancyRateModifiers> {
    return await this.create({ ...createOccupancyRateModifiersDto, uid })
  }

  async findAllWithFilterPaginated(payload: OccupancyRateModifiersQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }

  /* 
  ejemplo
  async prueba() {
    return this.getRepository().consultaPrueba()
  } */
}
