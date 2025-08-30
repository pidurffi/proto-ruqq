import { Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { QuoteTemplateBlock } from '../entities/quote-template-block.entity'
import { resources } from '../../../engine/database/constants'
import { QuoteTemplateBlockRepository } from '../repositories/quote-template-block.repository'
import { QuoteTemplateBlockQueryDto, QuoteTemplateBlockCreateDto } from '../dto'

@Injectable()
export class QuoteTemplateBlockService extends BaseEntityService<QuoteTemplateBlock> {
  constructor(
    @Inject(QuoteTemplateBlockRepository)
    private readonly repository: QuoteTemplateBlockRepository,
    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super()
  }

  protected getRepository(): QuoteTemplateBlockRepository {
    return this.repository
  }

  async createQuoteTemplateBlock(
    createQuoteTemplateBlockDto: QuoteTemplateBlockCreateDto,
    uid: string,
  ): Promise<QuoteTemplateBlock> {
    return await this.create({ ...createQuoteTemplateBlockDto, uid })
  }

  async findAllWithFilterPaginated(payload: QuoteTemplateBlockQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }

  /* 
  ejemplo
  async prueba() {
    return this.getRepository().consultaPrueba()
  } */
}
