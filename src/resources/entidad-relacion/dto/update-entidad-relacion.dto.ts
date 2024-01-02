import { PartialType } from '@nestjs/swagger'

import { CreateEntidadRelacionDto } from './create-entidad-relacion.dto'

export class UpdateEntidadRelacionDto extends PartialType(CreateEntidadRelacionDto) {}
