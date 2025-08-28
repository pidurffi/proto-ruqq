import { Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { BaseRatePeriod } from '../entities/base-rate-period.entity'
import { resources } from '../../../engine/database/constants'
import { BaseRatePeriodRepository } from '../repositories/base-rate-period.repository'
import { BaseRatePeriodQueryDto, BaseRatePeriodCreateDto } from '../dto'

@Injectable()
export class BaseRatePeriodService extends BaseEntityService<BaseRatePeriod> {
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

  async createBaseRatePeriod(
    createBaseRatePeriodDto: BaseRatePeriodCreateDto,
    uid: string,
  ): Promise<BaseRatePeriod> {
    return await this.create({ ...createBaseRatePeriodDto, uid })
  }

  async findAllWithFilterPaginated(payload: BaseRatePeriodQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }

  /* 
  ejemplo
  async prueba() {
    return this.getRepository().consultaPrueba()
  } */
}
