import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsString } from 'class-validator'
import { Transform } from 'class-transformer'

import { RequestPaginationDto } from '../../../common/dto/pagination.dto'
import { Room } from '../entities/room.entity'

export class RoomDto extends OmitType(Room, [
  'imgCoverPath',
  'imgCoverThumbPath',
  'id',
  'uid',
  'createdAt',
  'deletedAt',
  'updatedAt',
  'slug',
] as const) {
  @ApiProperty({ description: 'Indica si la habitación está habilitada' })
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  isOpen: boolean

  @Transform(({ value }) => parseInt(value))
  area: number

  @Transform(({ value }) => parseInt(value))
  qtyPax: number

  @Transform(({ value }) => parseInt(value))
  qtyBath: number

  @Transform(({ value }) => parseInt(value))
  qtyRooms: number
}

export class UpdateRoomDto extends PartialType(RoomDto) {}

export class RoomQueryDto extends RequestPaginationDto {
  @ApiProperty({ description: 'Dummy filter', required: false })
  @IsString()
  @IsOptional()
  dummy?: string
}

export class RoomResponseDto {
  id: string
  name: string
  shortDescription: string
  fullDescription: string
  slug: string
  // Otros campos que desees incluir en la respuesta
}
