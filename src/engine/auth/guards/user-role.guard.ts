import { Reflector } from '@nestjs/core'
import { CanActivate, ExecutionContext, Injectable, BadRequestException } from '@nestjs/common'

import { User } from '../entities/user.entity'
import { META_ROLES } from '../decorators/role-protected.decorator'

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Determina si el usuario puede activar una ruta en particular.
   * @param context - El contexto de ejecución.
   * @returns Una promesa que se resuelve a un booleano que indica si el usuario puede activar la ruta.
   */

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const validRoles: string[] = this.reflector.get(META_ROLES, context.getHandler())

    if (!validRoles) return true
    if (validRoles.length === 0) return true

    const req = context.switchToHttp().getRequest()
    const user = req.user as User

    if (!user) throw new BadRequestException('User not found')
    if (user.roles.includes('SUPER_ADMIN')) return true

    for (const role of user.roles) {
      if (validRoles.includes(role)) {
        return true
      }
    }
    return false
  }
}
