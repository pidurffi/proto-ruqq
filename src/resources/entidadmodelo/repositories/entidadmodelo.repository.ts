import { Inject, Injectable } from '@nestjs/common'
//import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Entidadmodelo } from '../entities'
import { repositories } from '../constants'

@Injectable()
export class EntidadmodeloRepository extends Repository<Entidadmodelo> {
  constructor(@Inject(repositories.ENTIDAD_MODELO_REPOSITORY) private readonly _: Repository<Entidadmodelo>) {
    super(_.target, _.manager, _.queryRunner)
  }
}
