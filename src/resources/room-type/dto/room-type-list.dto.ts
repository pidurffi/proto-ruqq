import { ApiProperty } from '@nestjs/swagger'
import { RoomType } from '../entities/room-type.entity'

export class RoomTypeListDto extends RoomType {
  @ApiProperty({
    description: 'Total de registros',
    example: 1,
  })
  total: number
}
