import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsOptional, IsString, IsUUID } from 'class-validator'

import { RequestPaginationDto } from '../../../common/dto/pagination.dto'
import { RoomImg } from '../entities/room-img.entity'

export class RoomImgDto extends OmitType(RoomImg, [
  'id',
  'uid',
  'imgPath',
  'imgThumbPath',
  'createdAt',
  'deletedAt',
  'updatedAt',
] as const) {
  @IsUUID()
  roomId: string
}

export class UpdateRoomImgDto extends PartialType(RoomImgDto) {}

export class RoomImgQueryDto extends RequestPaginationDto {
  @ApiProperty({ description: 'Dummy filter', required: false })
  @IsString()
  @IsOptional()
  dummy?: string
}
