import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsArray, IsOptional, IsString } from 'class-validator'

import { RequestPaginationDto } from '../../../common/dto/pagination.dto'
import { RoomEquipment } from '../entities/room-equipment.entity'

export class RoomEquipmentDto extends OmitType(RoomEquipment, [
  'uid',
  'id',
  'createdAt',
  'deletedAt',
  'updatedAt',
  'room',
  'equipment',
] as const) {
  @ApiProperty({ description: 'Room id', required: true })
  @IsString()
  roomId: string

  @ApiProperty({ description: 'Equipment id', required: true })
  @IsArray()
  equipmentIds: string[]
}

export class UpdateRoomEquipmentDto extends PartialType(RoomEquipmentDto) {}

export class RoomEquipmentQueryDto extends RequestPaginationDto {
  @ApiProperty({ description: 'Dummy filter', required: false })
  @IsString()
  @IsOptional()
  dummy?: string
}

// export class RoomEquipmentPaginationDto extends PaginationDto<RoomEquipment> {
//   @ApiProperty({ type: RoomEquipment, isArray: true })
//   data: RoomEquipment[]
// }
