import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

import { RequestPaginationDto } from '../../../common/dto/pagination.dto'

export class ContentBlockQueryDto extends RequestPaginationDto {
  @ApiProperty({
    description: 'Filtro de búsqueda',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string
}
