import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

import { RequestPaginationDto } from '../../../common/dto/pagination.dto'
import { Hotel } from '../entities/hotel.entity'

export class HotelDto extends OmitType(Hotel, [
  'imgCoverPath',
  'imgCoverThumbPath',
  'uid',
  'id',
  'createdAt',
  'deletedAt',
  'updatedAt',
] as const) {}

export class UpdateHotelDto extends PartialType(HotelDto) {}

export class HotelQueryDto extends RequestPaginationDto {
  @ApiProperty({ description: 'Dummy filter', required: false })
  @IsString()
  @IsOptional()
  dummy?: string
}

// export class HotelPaginationDto extends PaginationDto<Hotel> {
//   @ApiProperty({ type: Hotel, isArray: true })
//   data: Hotel[]
// }
