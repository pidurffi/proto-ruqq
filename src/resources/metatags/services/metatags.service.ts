import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { Metatags } from '../entities/metatags.entity'
import { baseErrors, EploggerService } from '../../../common'
import { resources } from '../../../engine/database/constants'
import { MetatagsRepository } from '../repositories/metatags.repository'
import { MetatagsDto, MetatagsQueryDto, UpdateMetatagsDto } from '../dto/metatags.dto'

@Injectable()
export class MetatagsService extends BaseEntityService<Metatags> {
  private context = 'MetatagsService'
  constructor(
    @Inject(MetatagsRepository)
    private readonly repository: MetatagsRepository,

    protected readonly logger: EploggerService,

    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super(logger)
  }

  protected getRepository(): MetatagsRepository {
    return this.repository
  }

  async createMetatags(templateDto: MetatagsDto, uid: string) {
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

  async updateMetatags(id: string, updateMetatagsDto: UpdateMetatagsDto, uid: string) {
    const template = await this.getRepository().preload({
      id,
      ...updateMetatagsDto,
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

  async findAllWithFilterPaginated(payload: MetatagsQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }
}
