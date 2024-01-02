import { OmitType } from '@nestjs/swagger'
import { IsOptional, IsUUID } from 'class-validator'

import { EntidadRelacion } from '../entities/'

export class CreateEntidadRelacionDto extends OmitType(EntidadRelacion, [
  'id',
  'uid',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'entidadModelo',
] as const) {
  @IsUUID()
  @IsOptional()
  entidadmodeloId: string
}
