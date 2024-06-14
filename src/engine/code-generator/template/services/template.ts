import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { BaseEntityService } from '../../../../common/services/base-entity.service'
import { Template } from '../entities/template'
import { baseErrors, EploggerService } from '../../../../common'
import { resources } from '../../../database/constants'
import { TemplateRepository } from '../repositories/template'
import { TemplateDto, TemplateQueryDto, UpdateTemplateDto } from '../dto/template'

@Injectable()
export class TemplateService extends BaseEntityService<Template> {
  private context = 'TemplateService'
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

  async createTemplate(templateDto: TemplateDto, uid: string) {
    try {
      const template = await this.create({
        ...templateDto,
        uid,
      })
      return template
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code === '23505') {
        throw new BadRequestException(`Hubo un error subiendo un registro duplicado: ${error.detail}`)
      }
      // Delegar otros errores al manejador de errores general
      this.handleErrors(error, this.context, false, [baseErrors.DUPLICATE_ENTRY])
    }
  }

  async updateTemplate(id: string, updateTemplateDto: UpdateTemplateDto, uid: string) {
    const template = await this.getRepository().preload({
      id,
      ...updateTemplateDto,
    })
    if (!template) {
      throw new BadRequestException('No se encontró el registro a actualizar')
    }
    //Create query runner
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()
    template.uid = uid
    try {
      await queryRunner.manager.save(template)
      await queryRunner.commitTransaction()
      await queryRunner.release() //con esto el queryRunner se desconecta, para que funcione hay que volverlo a conectar
      return this.findById(id)
      // await this.productRepostory.save(product);
      // return product;
    } catch (error) {
      await queryRunner.rollbackTransaction()
      await queryRunner.release()

      this.handleErrors(error, this.context, false, [baseErrors.DUPLICATE_ENTRY])
    }
  }

  async findAllWithFilterPaginated(payload: TemplateQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }
}
