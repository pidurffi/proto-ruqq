import { OmitType } from '@nestjs/swagger'
import { ContentBlock } from '../entities/content-block.entity'

export class ContentBlockCreateDto extends OmitType(ContentBlock, [
  'id',
  'uid',
  'createdAt',
  'deletedAt',
  'updatedAt',
] as const) {}
