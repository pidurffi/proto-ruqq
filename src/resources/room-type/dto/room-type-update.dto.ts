import { PartialType } from '@nestjs/swagger'
import { RoomTypeCreateDto } from './room-type-create.dto'

export class RoomTypeUpdateDto extends PartialType(RoomTypeCreateDto) {}
