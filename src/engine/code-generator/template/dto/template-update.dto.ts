import { PartialType } from '@nestjs/swagger'
import { TemplateCreateDto } from './template-create.dto'

export class TemplateUpdateDto extends PartialType(TemplateCreateDto) {}
