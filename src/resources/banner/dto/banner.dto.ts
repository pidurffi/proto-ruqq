import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsBoolean, IsDate, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator'
import { Transform } from 'class-transformer'

import { RequestPaginationDto } from '../../../common/dto/pagination.dto'
import { Banner } from '../entities/banner.entity'

export class BannerDto extends OmitType(Banner, [
  'imgPath',
  'thumbPath',
  'id',
  'uid',
  'createdAt',
  'deletedAt',
  'updatedAt',
] as const) {
  @ApiProperty({ description: 'Descripción del banner' })
  @IsString()
  @MaxLength(1000)
  description: string

  @ApiProperty({ description: 'Indica si el botón está habilitado' })
  @IsBoolean()
  @Transform(({ value }) => {
    return String(value).trim().toLowerCase() === 'true'
  })
  buttonEnabled: boolean

  @ApiProperty({ description: 'Texto del botón', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  buttonText?: string

  @ApiProperty({ description: 'Enlace del botón', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  buttonLink?: string

  @ApiProperty({ description: 'Indica si el banner es una PROMO' })
  @IsBoolean()
  @Transform(({ value }) => {
    return String(value).trim().toLowerCase() === 'true'
  })
  isPromo: boolean

  @Transform(({ value }) => new Date(value))
  @IsOptional()
  @IsDate()
  dateIn?: Date

  @ApiProperty({ description: 'Fecha de fin de la visibilidad del banner' })
  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  dateOut?: Date

  @ApiProperty({ description: 'Indica si el banner está habilitado' })
  @IsBoolean()
  @Transform(({ value }) => {
    return String(value).trim().toLowerCase() === 'true'
  })
  enabled: boolean

  @ApiProperty({ description: 'Orden en el que se muestran las promos' })
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  order: number
}

export class UpdateBannerDto extends PartialType(BannerDto) {}

export class BannerQueryDto extends RequestPaginationDto {
  @ApiProperty({ description: 'Dummy filter', required: false })
  @IsString()
  @IsOptional()
  dummy?: string
}

// export class BannerPaginationDto extends PaginationDto<Banner> {
//   @ApiProperty({ type: Banner, isArray: true })
//   data: Banner[]
// }
