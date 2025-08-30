import { ApiProperty } from '@nestjs/swagger'
import { ContentBlock } from '../entities/content-block.entity'

export class ContentBlockListDto extends ContentBlock {
  @ApiProperty({
    description: 'Total de registros',
    example: 1,
  })
  total: number
}
