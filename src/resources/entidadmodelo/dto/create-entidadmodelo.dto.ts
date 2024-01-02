import { OmitType } from '@nestjs/swagger'

import { Entidadmodelo } from '../entities/entidadmodelo.entity'

export class CreateEntidadmodeloDto extends OmitType(Entidadmodelo, [
  'id',
  'uid',
  'createdAt',
  'updatedAt',
  'deletedAt',
] as const) {}
