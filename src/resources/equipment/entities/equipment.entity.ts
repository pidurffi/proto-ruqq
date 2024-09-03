import { Entity, Column, OneToMany } from 'typeorm'
import { IsOptional, IsString, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

import { EntityBase } from '../../../common/entities/base.entity'
import { RoomEquipment } from '../../room-equipment/entities/room-equipment.entity'

@Entity({ name: 'equipment' })
export class Equipment extends EntityBase {
  @ApiProperty({ description: 'Nombre del equipamiento', required: true })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string

  @ApiProperty({ description: 'slug del equipamiento' })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'varchar', length: 255, nullable: false })
  @IsOptional()
  slug?: string

  @ApiProperty({ description: 'Descripción del equipamiento' })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string

  @OneToMany(() => RoomEquipment, roomEquipment => roomEquipment.equipment)
  roomEquipments: RoomEquipment[]
}
