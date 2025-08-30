import { PartialType } from '@nestjs/swagger'
import { QuoteTemplateBlockCreateDto } from './quote-template-block-create.dto'

export class QuoteTemplateBlockUpdateDto extends PartialType(QuoteTemplateBlockCreateDto) {}
