import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { BaseEntityService } from '../../../../common/services/base-entity.service'
import { Template } from '../entities/template'
import { baseErrors, WinstonLoggerService } from '../../../../common'
import { resources } from '../../../database/constants'
import { TemplateRepository } from '../repositories/template'
import { TemplateQueryDto, TemplateCreateDto } from '../dto'

@Injectable()
export class TemplateService extends BaseEntityService<Template> {
  private context = 'Template'
  constructor(
    @Inject(TemplateRepository)
    private readonly repository: TemplateRepository,

    protected readonly logger: WinstonLoggerService,

    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super(logger)
  }

  protected getRepository(): TemplateRepository {
    return this.repository
  }

  async createTemplate(
    createTemplateDto: TemplateCreateDto,
    uid: string,
  ): Promise<Template | undefined> {
    try {
      return await this.create({ ...createTemplateDto, uid })
    } catch (error) {
      await this.handleErrors(error, this.context, false, [
        baseErrors.DUPLICATE_ENTRY,
      ])
    }
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
