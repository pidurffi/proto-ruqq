import { PartialType } from '@nestjs/swagger'

import { CreateEntidadmodeloDto } from './create-entidadmodelo.dto'

export class UpdateEntidadmodeloDto extends PartialType(CreateEntidadmodeloDto) {}
