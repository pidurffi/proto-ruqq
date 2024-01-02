import { Reflector } from '@nestjs/core'
import { CanActivate, ExecutionContext, Injectable, BadRequestException } from '@nestjs/common'

import { User } from '../entities/user.entity'
import { META_ROLES } from '../decorators/role-protected.decorator'
import { RoleService } from '../services'
import { Role } from '../entities'

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly roleService: RoleService) {}

  /**
   * Determina si el usuario puede activar una ruta en particular.
   * @param context - El contexto de ejecución.
   * @returns Una promesa que se resuelve a un booleano que indica si el usuario puede activar la ruta.
   */

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const actualModules: string[] = this.reflector.get(META_ROLES, context.getHandler())

    if (!actualModules) return true
    if (actualModules.length === 0) return true

    const req = context.switchToHttp().getRequest()
    const user = req.user as User

    if (!user) throw new BadRequestException('User not found')
    if (user.roles.includes('SUPER_ADMIN')) return true

    const activeRoles = await this.roleService.findActiveRolesByUserRoles(user.roles)

    if (!activeRoles || activeRoles.length === 0) return false
    const hasPermission = activeRoles.some((role: Role) => {
      const encontrados = actualModules.filter((module: string) => role.modules.includes(module))
      return !!encontrados.length
    })
    return hasPermission

    //throw new ForbiddenException(`User ${user.fullName} need a valid role: [${validRoles}]`)
    // throw new ForbiddenException(
    //   `User ${user.fullName} does not have access to this module. Check your permissions or contact an Admin`,
    // )
  }
}
