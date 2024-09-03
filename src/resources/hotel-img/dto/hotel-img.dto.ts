import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

import { RequestPaginationDto } from '../../../common/dto/pagination.dto'
import { HotelImg } from '../entities/hotel-img.entity'

export class HotelImgDto extends OmitType(HotelImg, [
  'id',
  'uid',
  'imgPath',
  'imgThumbPath',
  'createdAt',
  'deletedAt',
  'updatedAt',
] as const) {}

export class UpdateHotelImgDto extends PartialType(HotelImgDto) {}

export class HotelImgQueryDto extends RequestPaginationDto {
  @ApiProperty({ description: 'Dummy filter', required: false })
  @IsString()
  @IsOptional()
  dummy?: string
}

// export class HotelImgPaginationDto extends PaginationDto<HotelImg> {
//   @ApiProperty({ type: HotelImg, isArray: true })
//   data: HotelImg[]
// }
