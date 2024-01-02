import { Injectable } from '@nestjs/common'

import { BaseEntityService } from '../services/base-entity.service'
import { EntityBase } from '../entities/base.entity'

@Injectable()
export abstract class BaseController<T extends EntityBase> {
  protected abstract getService(): BaseEntityService<T>
}
