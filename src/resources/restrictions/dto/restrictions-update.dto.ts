import { PartialType } from '@nestjs/swagger'
import { RestrictionsCreateDto } from './restrictions-create.dto'

export class RestrictionsUpdateDto extends PartialType(RestrictionsCreateDto) {}
