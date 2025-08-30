import { Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { QuoteTemplate } from '../entities/quote-template.entity'
import { resources } from '../../../engine/database/constants'
import { QuoteTemplateRepository } from '../repositories/quote-template.repository'
import { QuoteTemplateQueryDto, QuoteTemplateCreateDto } from '../dto'

@Injectable()
export class QuoteTemplateService extends BaseEntityService<QuoteTemplate> {
  constructor(
    @Inject(QuoteTemplateRepository)
    private readonly repository: QuoteTemplateRepository,
    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super()
  }

  protected getRepository(): QuoteTemplateRepository {
    return this.repository
  }

  async createQuoteTemplate(createQuoteTemplateDto: QuoteTemplateCreateDto, uid: string): Promise<QuoteTemplate> {
    return await this.create({ ...createQuoteTemplateDto, uid })
  }

  async findAllWithFilterPaginated(payload: QuoteTemplateQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }

  /* 
  ejemplo
  async prueba() {
    return this.getRepository().consultaPrueba()
  } */
}
