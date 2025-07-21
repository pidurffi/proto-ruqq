import { ApiProperty } from '@nestjs/swagger'
import { Template } from '../entities/template'

export class TemplateListDto extends Template {
  @ApiProperty({
    description: 'Total de registros',
    example: 1,
  })
  total: number
}
