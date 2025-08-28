import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsNumber } from 'class-validator'
import { Transform } from 'class-transformer'

import { RequestPaginationDto } from '../../../common/dto/pagination.dto'

export class RoomTypeQueryDto extends RequestPaginationDto {
  @ApiProperty({
    description: 'Filtro de búsqueda por nombre o código',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string

  @ApiProperty({
    description: 'Filtrar por código exacto',
    required: false,
  })
  @IsString()
  @IsOptional()
  code?: string

  @ApiProperty({
    description: 'Filtrar por inventario mínimo',
    required: false,
  })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  minInventory?: number
}
