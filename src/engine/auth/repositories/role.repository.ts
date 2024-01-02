import { Inject, Injectable } from '@nestjs/common'
//import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Role } from '../entities'
import { repositories } from '../constants'

@Injectable()
export class RoleRepository extends Repository<Role> {
  constructor(@Inject(repositories.ROLE_REPOSITORY) private readonly _: Repository<Role>) {
    super(_.target, _.manager, _.queryRunner)
  }

  async findActiveRolesByUserRoles(roles: string[]): Promise<Role[]> {
    const activeRoles = await this.createQueryBuilder('role')
      .where('role.name IN (:...names)', { names: roles })
      .getMany()

    return activeRoles
  }
}
