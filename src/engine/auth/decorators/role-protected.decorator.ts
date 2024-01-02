import { SetMetadata } from '@nestjs/common'

//import { ValidRoles } from '../interfaces'
import { ValidModules } from '../interfaces'

export const META_ROLES = 'modules'

export const RoleProtected = (...args: ValidModules[]) => {
  return SetMetadata(META_ROLES, args)
}
