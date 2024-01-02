import { Inject, Injectable, BadRequestException } from '@nestjs/common'
import { DataSource, UpdateResult } from 'typeorm'

import { CreateEntidadmodeloDto, UpdateEntidadmodeloDto } from '../dto/'
import { Entidadmodelo } from '../entities/'
import { User } from '../../../engine/auth'
import { EploggerService, baseErrors } from '../../../common'
import { resources } from '../../../engine/database/constants'
import { BaseEntityService } from '../../../common/services/base-entity.service'
import { EntidadmodeloRepository } from '../repositories/entidadmodelo.repository'

@Injectable()
export class EntidadmodeloService extends BaseEntityService<Entidadmodelo> {
  private context = 'Entidad Modelo'
  constructor(
    @Inject(EntidadmodeloRepository)
    private readonly entidadmodeloRepository: EntidadmodeloRepository,

    protected readonly logger: EploggerService,

    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super(logger)
  }

  protected getRepository(): EntidadmodeloRepository {
    return this.entidadmodeloRepository
  }

  async createEntidadmodelo(
    createEntidadmodeloDto: CreateEntidadmodeloDto,
    uid: string,
  ): Promise<Entidadmodelo | undefined> {
    try {
      return await this.create({ ...createEntidadmodeloDto, uid })
    } catch (error) {
      this.handleErrors(error, this.context, false, [baseErrors.DUPLICATE_ENTRY])
    }
  }

  async findOne(id: string) {
    const entidadmodelo: Entidadmodelo | null = await this.getRepository().findOneBy({
      id,
    })
    if (!entidadmodelo) throw new BadRequestException(`Registro ${this.context} con id: ${id} no encontrado`)
    return entidadmodelo
  }

  async update(id: string, updateEntidadmodeloDto: UpdateEntidadmodeloDto, user: User) {
    const entidadmodelo = await this.getRepository().preload({
      id,
      ...updateEntidadmodeloDto,
    })

    if (!entidadmodelo) throw new BadRequestException(`Registro width ID ${id} not found.`)

    //Create query runner
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()
    entidadmodelo.uid = user.id
    try {
      await queryRunner.manager.save(entidadmodelo)
      await queryRunner.commitTransaction()
      await queryRunner.release() //con esto el queryRunner se desconecta, para que funcione hay que volverlo a conectar
      return this.findOne(id)
      // await this.entidadmodeloRepostory.save(entidadmodelo);
      // return entidadmodelo;
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
