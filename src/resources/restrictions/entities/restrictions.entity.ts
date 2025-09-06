import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { IsUUID, IsDateString, IsInt, IsBoolean, IsOptional, Min } from 'class-validator'

import { EntityBase } from '../../../common/entities/base.entity'
import { RoomType } from '../../room-type/entities/room-type.entity'

@Entity({ name: 'restrictions' })
export class Restrictions extends EntityBase {
  @Column({ type: 'uuid', name: 'room_type_id' })
  @ApiProperty({
    description: 'ID del tipo de habitación',
    type: String
  })
  @IsUUID()
  roomTypeId: string

  @Column({ type: 'date', name: 'start_date' })
  @ApiProperty({
    description: 'Fecha de inicio de la restricción',
    example: '2025-12-20'
  })
  @IsDateString()
  startDate: Date

  @Column({ type: 'date', name: 'end_date' })
  @ApiProperty({
    description: 'Fecha de fin de la restricción',
    example: '2025-01-10'
  })
  @IsDateString()
  endDate: Date

  @Column({ type: 'integer', nullable: true, name: 'min_length_of_stay' })
  @ApiProperty({
    description: 'Estancia mínima en noches',
    example: 7,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  minLengthOfStay?: number

  @Column({ type: 'integer', nullable: true, name: 'max_length_of_stay' })
  @ApiProperty({
    description: 'Estancia máxima en noches',
    example: 30,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxLengthOfStay?: number

  @Column({ type: 'boolean', default: false, name: 'closed_to_arrival' })
  @ApiProperty({
    description: 'No se permiten check-ins en estos días',
    example: false
  })
  @IsBoolean()
  closedToArrival: boolean

  @Column({ type: 'boolean', default: false, name: 'closed_to_departure' })
  @ApiProperty({
    description: 'No se permiten check-outs en estos días',
    example: false
  })
  @IsBoolean()
  closedToDeparture: boolean

  @ManyToOne(() => RoomType)
  @JoinColumn({ name: 'room_type_id' })
  roomType: RoomType
}
