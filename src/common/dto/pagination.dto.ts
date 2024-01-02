import { ApiProperty, OmitType } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { Type } from 'class-transformer'

import { SortOrderEnum } from '../enums/sort.enum'

export class PaginationDto<T> {
  constructor(values?: Partial<PaginationDto<T>>) {
    Object.assign(this, values)
  }

  @ApiProperty({ description: 'Data' })
  data: T[]

  @ApiProperty({ description: 'Current page', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  page: number

  @ApiProperty({ description: 'Page size', required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  pageSize: number

  @ApiProperty({ description: 'Total', required: false })
  @IsNumber()
  @Type(() => Number)
  total: number

  @ApiProperty({ description: 'Last page', required: false })
  @IsNumber()
  @Type(() => Number)
  lastPage: number

  @ApiProperty({ description: 'Next page (endpoint)', required: false })
  @IsString()
  next: string

  @ApiProperty({ description: 'Previous page (endpoint)', required: false })
  @IsString()
  previous: string
}

export class RequestPaginationDto extends OmitType(PaginationDto, [
  'data',
  'lastPage',
  'total',
  'next',
  'previous',
] as const) {
  @ApiProperty({
    description: 'Sort order',
    type: String,
  })
  @IsOptional()
  @IsEnum(SortOrderEnum, { message: 'Sort order must be ASC or DESC' })
  @IsNotEmpty()
  sortOrder?: SortOrderEnum

  @ApiProperty({
    description: 'Sort by',
    type: String,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sortBy?: string
}
