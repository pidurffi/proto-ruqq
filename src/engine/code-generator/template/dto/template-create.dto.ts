import { OmitType } from '@nestjs/swagger'
import { Template } from '../entities/template'

export class TemplateCreateDto extends OmitType(Template, [
  'id',
  'uid',
  'createdAt',
  'deletedAt',
  'updatedAt',
] as const) {}
