import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { DataSource, UpdateResult } from 'typeorm'

import { User } from '../../../engine/auth'
import { EploggerService, baseErrors } from '../../../common'
import { resources } from '../../../engine/database/constants'
import { BaseEntityService } from '../../../common/services/base-entity.service'
import { EntidadmodeloService } from '../../entidadmodelo/services/'
import { EntidadRelacion } from '../entities'
import { CreateEntidadRelacionDto } from '../dto/create-entidad-relacion.dto'
import { UpdateEntidadRelacionDto } from '../dto/update-entidad-relacion.dto'
import { EntidadRelacionRepository } from '../repositories/entidad-relacion.repository'

@Injectable()
export class EntidadRelacionService extends BaseEntityService<EntidadRelacion> {
  private context = 'Entidad Relacion'
  constructor(
    @Inject(EntidadRelacionRepository)
    private readonly entidadRelacionRepository: EntidadRelacionRepository,
    private readonly entidamodeloService: EntidadmodeloService,

    protected readonly logger: EploggerService,

    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super(logger)
  }

  protected getRepository(): EntidadRelacionRepository {
    return this.entidadRelacionRepository
  }

  async createEntidadRelacion(
    createEntidadRelacionDto: CreateEntidadRelacionDto,
    uid: string,
  ): Promise<EntidadRelacion | undefined> {
    const { entidadmodeloId, ...restToCreate } = createEntidadRelacionDto
    try {
      // entidadesModeloId es opcional, entonces si viene se busca el registro y se asigna a la entidadRelacion
      let entidadModelo
      if (entidadmodeloId) {
        entidadModelo = await this.entidamodeloService.findByIdOrFail(entidadmodeloId)
      }

      return await this.create({ ...restToCreate, entidadModelo, uid })
    } catch (error) {
      this.handleErrors(error, this.context, false, [baseErrors.DUPLICATE_ENTRY])
    }
  }

  async findOne(id: string) {
    const entidadRelacion: EntidadRelacion | null = await this.getRepository().findOneBy({
      id,
    })
    if (!entidadRelacion) throw new BadRequestException(`Registro ${this.context} con id: ${id} no encontrado`)
    return entidadRelacion
  }

  async update(id: string, updateEntidadRelacionDto: UpdateEntidadRelacionDto, user: User) {
    const entidadRelacion = await this.getRepository().preload({
      id,
      ...updateEntidadRelacionDto,
    })

    if (!entidadRelacion) throw new BadRequestException(`Registro width ID ${id} not found.`)

    //Create query runner
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()
    entidadRelacion.uid = user.id

    try {
      await queryRunner.manager.save(entidadRelacion)
      await queryRunner.commitTransaction()
      await queryRunner.release() //con esto el queryRunner se desconecta, para que funcione hay que volverlo a conectar
      return this.findOne(id)
      // await this.entidadRelacionRepostory.save(entidadRelacion);
      // return entidadRelacion;
    } catch (error) {
      await queryRunner.rollbackTransaction()
      await queryRunner.release()

      this.handleErrors(error, this.context, false, [baseErrors.DUPLICATE_ENTRY])
    }
  }

  async remove(id: string): Promise<UpdateResult> {
    return this.deleteOrFail(id)
  }
}
