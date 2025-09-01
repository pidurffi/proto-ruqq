import { Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { Restrictions } from '../entities/restrictions.entity'
import { resources } from '../../../engine/database/constants'
import { RestrictionsRepository } from '../repositories/restrictions.repository'
import { RestrictionsQueryDto, RestrictionsCreateDto } from '../dto'

@Injectable()
export class RestrictionsService extends BaseEntityService<Restrictions> {
  constructor(
    @Inject(RestrictionsRepository)
    private readonly repository: RestrictionsRepository,
    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super()
  }

  protected getRepository(): RestrictionsRepository {
    return this.repository
  }

  async createRestrictions(
    createRestrictionsDto: RestrictionsCreateDto,
    uid: string,
  ): Promise<Restrictions> {
    return await this.create({ ...createRestrictionsDto, uid })
  }

  async findAllWithFilterPaginated(payload: RestrictionsQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }

  /* 
  ejemplo
  async prueba() {
    return this.getRepository().consultaPrueba()
  } */
}
