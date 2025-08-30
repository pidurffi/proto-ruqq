import { Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { ContentBlock } from '../entities/content-block.entity'
import { resources } from '../../../engine/database/constants'
import { ContentBlockRepository } from '../repositories/content-block.repository'
import { ContentBlockQueryDto, ContentBlockCreateDto } from '../dto'

@Injectable()
export class ContentBlockService extends BaseEntityService<ContentBlock> {
  constructor(
    @Inject(ContentBlockRepository)
    private readonly repository: ContentBlockRepository,
    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super()
  }

  protected getRepository(): ContentBlockRepository {
    return this.repository
  }

  async createContentBlock(
    createContentBlockDto: ContentBlockCreateDto,
    uid: string,
  ): Promise<ContentBlock> {
    return await this.create({ ...createContentBlockDto, uid })
  }

  async findAllWithFilterPaginated(payload: ContentBlockQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }

  /* 
  ejemplo
  async prueba() {
    return this.getRepository().consultaPrueba()
  } */
}
