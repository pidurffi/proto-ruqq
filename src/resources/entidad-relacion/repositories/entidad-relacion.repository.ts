import { Inject, Injectable } from '@nestjs/common'
//import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { EntidadRelacion } from '../entities'
import { repositories } from '../constants'

@Injectable()
export class EntidadRelacionRepository extends Repository<EntidadRelacion> {
  constructor(@Inject(repositories.ENTIDAD_RELACION_REPOSITORY) private readonly _: Repository<EntidadRelacion>) {
    super(_.target, _.manager, _.queryRunner)
  }
}
