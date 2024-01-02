import { Inject, Injectable } from '@nestjs/common'
//import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Template } from '../entities/template'
import { repositories } from '../constants'

@Injectable()
export class TemplateRepository extends Repository<Template> {
  constructor(@Inject(repositories.TEMPLATE_REPOSITORY) private readonly _: Repository<Template>) {
    super(_.target, _.manager, _.queryRunner)
  }

  /* 
  ejemplo
  public consultaPrueba() {
    return this.createQueryBuilder('bateria').getMany()
  } */
}
