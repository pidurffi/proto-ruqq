import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { Section } from '../entities/section.entity'
import { baseErrors, EploggerService } from '../../../common'
import { resources } from '../../../engine/database/constants'
import { SectionRepository } from '../repositories/section.repository'
import { SectionDto, SectionQueryDto } from '../dto/section.dto'

@Injectable()
export class SectionService extends BaseEntityService<Section> {
  private context = 'Section'
  constructor(
    @Inject(SectionRepository)
    private readonly repository: SectionRepository,

    protected readonly logger: EploggerService,

    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super(logger)
  }

  protected getRepository(): SectionRepository {
    return this.repository
  }

  async createSection(sectionDto: SectionDto, uid: string) {
    try {
      const section = await this.create({
        ...sectionDto,
        uid,
      })
      return section
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code === '23505') {
        throw new BadRequestException(`A text block with the name '${sectionDto.title}' already exists.`)
      }
      // Delegar otros errores al manejador de errores general
      this.handleErrors(error, this.context, false, [baseErrors.DUPLICATE_ENTRY])
    }
  }

  async findAllWithFilterPaginated(payload: SectionQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }
}
