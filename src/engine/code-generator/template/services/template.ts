import { Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { BaseEntityService } from '../../../../common/services/base-entity.service'
import { Template } from '../entities/template'
import { EploggerService } from '../../../../common'
import { resources } from '../../../database/constants'
import { TemplateRepository } from '../repositories/template'

@Injectable()
export class TemplateService extends BaseEntityService<Template> {
  constructor(
    @Inject(TemplateRepository)
    private readonly repository: TemplateRepository,

    protected readonly logger: EploggerService,

    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super(logger)
  }

  protected getRepository(): TemplateRepository {
    return this.repository
  }

  /* 
  ejemplo
  async prueba() {
    return this.getRepository().consultaPrueba()
  } */
}
