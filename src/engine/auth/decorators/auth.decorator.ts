import { UseGuards, applyDecorators } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

import { RoleProtected } from './role-protected.decorator'
import { UserRoleGuard } from '../guards/user-role.guard'
import { ValidModules } from '../interfaces/valid-modules'

export function Auth(...modules: ValidModules[]) {
  return applyDecorators(RoleProtected(...modules), UseGuards(AuthGuard(), UserRoleGuard))
}
