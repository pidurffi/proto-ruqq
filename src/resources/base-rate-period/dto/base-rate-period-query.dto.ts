import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator'
import { Transform } from 'class-transformer'

import { RequestPaginationDto } from '../../../common/dto/pagination.dto'

export class BaseRatePeriodQueryDto extends RequestPaginationDto {
  @ApiProperty({
    description: 'Filtro de búsqueda',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string

  @ApiProperty({
    description: 'ID del tipo de habitación',
    required: false,
  })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  roomTypeId?: number

  @ApiProperty({
    description: 'Fecha de inicio del período (filtrar desde)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: Date

  @ApiProperty({
    description: 'Fecha de fin del período (filtrar hasta)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: Date
}
