import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

import { RequestPaginationDto } from '../../../common/dto/pagination.dto'

export class PriceRulesQueryDto extends RequestPaginationDto {
  @ApiProperty({
    description: 'Filtro de búsqueda',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string

  @ApiProperty({
    description: 'Filtrar solo promociones (price rules con promotionName)',
    required: false,
    example: 'true'
  })
  @IsOptional()
  @IsString()
  promotionsOnly?: string
}
