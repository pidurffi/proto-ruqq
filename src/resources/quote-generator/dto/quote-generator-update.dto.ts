import { PartialType } from '@nestjs/swagger'
import { QuoteGeneratorCreateDto } from './quote-generator-create.dto'

export class QuoteGeneratorUpdateDto extends PartialType(QuoteGeneratorCreateDto) {}
