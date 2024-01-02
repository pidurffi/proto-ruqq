import { BadRequestException, Inject, Injectable } from '@nestjs/common'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { ValidModules } from '../interfaces'
import { Role, User } from '../entities'
import { EploggerService } from '../../../common'
import { CreateRoleDto } from '../dto'
import { PromoteRoleDto } from '../dto/role.dto'
import { RoleRepository } from '../repositories/role.repository'

@Injectable()
export class RoleService extends BaseEntityService<Role> {
  private context = 'AuthModule'

  constructor(
    @Inject(RoleRepository)
    private readonly roleReposity: RoleRepository,

    protected readonly logger: EploggerService,
  ) {
    super(logger)
  }

  protected getRepository(): RoleRepository {
    return this.roleReposity
  }

  // getModules() {
  //   return Object.values(ValidModules)
  // }

  getModules(): Record<string, string[]> {
    const modules = Object.values(ValidModules)

    // const modules = [
    //   'super',
    //   'bateria',
    //   'bateria-create',
    //   'bateria-update',

    //   'bloque',
    //   'bloque-create',
    //   'bloque-update',

    //   'distribucion-por-capas',
    //   'distribucion-por-capas-create',
    //   'distribucion-por-capas-update',
    //   'ultimo',
    // ]

    const result: Record<string, string[]> = {}
    let currentParent = ''
    let actualSinGuion = ''
    let siguienteSinGuion = ''
    let actual = ''
    let siguiente = ''
    for (let i = 0; i < modules.length; i++) {
      const moduloActual = modules[i]
      if (!moduloActual.includes('template')) {
        if (i + 1 < modules.length) {
          actual = modules[i]
          siguiente = modules[i + 1]

          siguienteSinGuion =
            siguiente.lastIndexOf('-') !== -1 ? siguiente.substring(0, siguiente.lastIndexOf('-')) : siguiente

          actualSinGuion = actual.lastIndexOf('-') !== -1 ? actual.substring(0, actual.lastIndexOf('-')) : actual

          if (actualSinGuion !== currentParent) {
            currentParent = actual
            result[currentParent] = []
          }
          result[currentParent].push(moduloActual)
        }
        // si es el ultimo:
        else {
          if (actualSinGuion === siguienteSinGuion) {
            result[currentParent].push(siguiente)
          } else {
            result[siguiente] = []
            result[moduloActual].push(moduloActual)
          }
        }
      }
    }
    return result
  }

  async createRole(createRoleDto: CreateRoleDto, user: User): Promise<Role | undefined> {
    try {
      return await this.create({ ...createRoleDto, uid: user.id })
    } catch (error) {
      this.handleErrors(error)
    }
  }

  async findActiveRolesByUserRoles(roles: string[]) {
    return this.roleReposity.findActiveRolesByUserRoles(roles)
  }

  async findActiveRoles() {
    return this.roleReposity.findBy({ isActive: true })
  }

  async promote(rolePromoteDto: PromoteRoleDto): Promise<Role> {
    const { code, modules } = rolePromoteDto

    const role = await this.findOneByFilter({
      where: { name: code, isActive: true },
    })

    //chequeo que existe un usuario valido para email
    if (!role) {
      this.logger.error({
        message: `El role ${code} no existe`,
        sendEmail: false,
        stack: BadRequestException.name,
        context: this.context,
      })
      throw new BadRequestException(`El role ${role} no existe`)
    }

    //le asigno los roles tal cual llegaron (ya estan validados previamente)
    await this.getRepository().update(role.id, { modules })

    const roleUpdated: Role = {
      ...role,
      modules,
    }
    return roleUpdated
  }
}
