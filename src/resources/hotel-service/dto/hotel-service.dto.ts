import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsArray, IsOptional, IsString } from 'class-validator'

import { RequestPaginationDto } from '../../../common/dto/pagination.dto'
import { HotelService } from '../entities/hotel-service.entity'

export class HotelServiceDto extends OmitType(HotelService, [
  'uid',
  'id',
  'createdAt',
  'deletedAt',
  'updatedAt',
] as const) {
  @ApiProperty({ description: 'Service id', required: true })
  @IsArray()
  serviceIds: string[]
}

export class UpdateHotelServiceDto extends PartialType(HotelServiceDto) {}

export class HotelServiceQueryDto extends RequestPaginationDto {
  @ApiProperty({ description: 'Dummy filter', required: false })
  @IsString()
  @IsOptional()
  dummy?: string
}

// export class HotelServicePaginationDto extends PaginationDto<HotelService> {
//   @ApiProperty({ type: HotelService, isArray: true })
//   data: HotelService[]
// }
