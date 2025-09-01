import { OmitType } from '@nestjs/swagger'
import { Restrictions } from '../entities/restrictions.entity'

export class RestrictionsCreateDto extends OmitType(Restrictions, [
  'id',
  'uid',
  'createdAt',
  'deletedAt',
  'updatedAt',
] as const) {}
