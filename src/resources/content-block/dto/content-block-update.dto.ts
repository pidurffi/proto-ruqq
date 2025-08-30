import { PartialType } from '@nestjs/swagger'
import { ContentBlockCreateDto } from './content-block-create.dto'

export class ContentBlockUpdateDto extends PartialType(ContentBlockCreateDto) {}
