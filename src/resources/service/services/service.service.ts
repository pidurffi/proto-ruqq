import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { Service } from '../entities/service.entity'
import { baseErrors, EploggerService } from '../../../common'
import { resources } from '../../../engine/database/constants'
import { ServiceRepository } from '../repositories/service.repository'
import { ServiceDto, ServiceQueryDto, UpdateServiceDto } from '../dto/service.dto'

@Injectable()
export class ServiceService extends BaseEntityService<Service> {
  private context = 'ServiceService'
  constructor(
    @Inject(ServiceRepository)
    private readonly repository: ServiceRepository,

    protected readonly logger: EploggerService,

    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super(logger)
  }

  protected getRepository(): ServiceRepository {
    return this.repository
  }

  async createService(templateDto: ServiceDto, uid: string) {
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

  async updateService(id: string, updateServiceDto: UpdateServiceDto, uid: string) {
    const template = await this.getRepository().preload({
      id,
      ...updateServiceDto,
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

  async getAllServices() {
    return this.getRepository().find()
  }

  async findAllWithFilterPaginated(payload: ServiceQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }
}
