import { Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { RatePlan } from '../entities/rate-plan.entity'
import { resources } from '../../../engine/database/constants'
import { RatePlanRepository } from '../repositories/rate-plan.repository'
import { RatePlanQueryDto, RatePlanCreateDto } from '../dto'

@Injectable()
export class RatePlanService extends BaseEntityService<RatePlan> {
  constructor(
    @Inject(RatePlanRepository)
    private readonly repository: RatePlanRepository,
    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super()
  }

  protected getRepository(): RatePlanRepository {
    return this.repository
  }

  async createRatePlan(
    createRatePlanDto: RatePlanCreateDto,
    uid: string,
  ): Promise<RatePlan> {
    return await this.create({ ...createRatePlanDto, uid })
  }

  async findAllWithFilterPaginated(payload: RatePlanQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }

  /* 
  ejemplo
  async prueba() {
    return this.getRepository().consultaPrueba()
  } */
}
