import { Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { BaseEntityService } from '../../../../common/services/base-entity.service'
import { Template } from '../entities/template'
import { resources } from '../../../database/constants'
import { TemplateRepository } from '../repositories/template'
import { TemplateQueryDto, TemplateCreateDto } from '../dto'

@Injectable()
export class TemplateService extends BaseEntityService<Template> {
  constructor(
    @Inject(TemplateRepository)
    private readonly repository: TemplateRepository,
    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super()
  }

  protected getRepository(): TemplateRepository {
    return this.repository
  }

  async createTemplate(
    createTemplateDto: TemplateCreateDto,
    uid: string,
  ): Promise<Template> {
    return await this.create({ ...createTemplateDto, uid })
  }

  async findAllWithFilterPaginated(payload: TemplateQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }

  /* 
  ejemplo
  async prueba() {
    return this.getRepository().consultaPrueba()
  } */
}
