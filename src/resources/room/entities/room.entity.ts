import { Entity, Column, OneToMany } from 'typeorm'
import { IsString, MaxLength, IsInt, Min, IsBoolean, IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

import { EntityBase } from '../../../common/entities/base.entity'
import { RoomEquipment } from '../../room-equipment/entities/room-equipment.entity'
import { RoomImg } from '../../room-img/entities/room-img.entity'
@Entity({ name: 'room' })
export class Room extends EntityBase {
  @ApiProperty({ description: 'Nombre de la habitación' })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'text', nullable: false, unique: true })
  name: string

  @ApiProperty({ description: 'Identificador único de URL amigable para la habitación' })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'text', nullable: false })
  slug: string

  @ApiProperty({ description: 'URL de la imagen del cover' })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'text', nullable: false })
  imgCoverPath: string

  @ApiProperty({ description: 'URL de la imagen del cover' })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'text', nullable: false })
  imgCoverThumbPath: string

  @ApiProperty({ description: 'Título de la habitación' })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'text', nullable: false })
  shortDescription: string

  @ApiProperty({ description: 'Subtítulo de la habitación' })
  @IsString()
  @Column({ type: 'text', nullable: true })
  fullDescription: string

  @ApiProperty({ description: 'Área de la habitación en metros cuadrados' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Column({ type: 'integer', nullable: true })
  area?: number

  @ApiProperty({ description: 'Capacidad máxima de personas' })
  @IsInt()
  @Min(0)
  @Column({ type: 'integer', nullable: false })
  qtyPax: number

  @ApiProperty({ description: 'Cantidad de baños en la habitación' })
  @IsInt()
  @Min(0)
  @Column({ type: 'integer', nullable: false })
  qtyBath: number

  @ApiProperty({ description: 'Cantidad de habitaciones' })
  @IsInt()
  @Min(0)
  @Column({ type: 'integer', nullable: false })
  qtyRooms: number

  @ApiProperty({ description: 'Indica si la habitación está habilitada para recibir huéspedes', required: false })
  @IsBoolean()
  @Column({ type: 'boolean', nullable: false, default: true })
  isOpen: boolean

  @OneToMany(() => RoomEquipment, roomEquipment => roomEquipment.room, { cascade: true })
  roomEquipments: RoomEquipment[]

  @OneToMany(() => RoomImg, roomImg => roomImg.room, { cascade: true })
  roomImgs: RoomImg[]
}
