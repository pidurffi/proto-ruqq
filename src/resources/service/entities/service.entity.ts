import { Entity, Column, OneToMany } from 'typeorm'
import { IsOptional, IsString, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

import { EntityBase } from '../../../common/entities/base.entity'
import { HotelService } from '../../hotel-service/entities/hotel-service.entity'

@Entity()
export class Service extends EntityBase {
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

  @OneToMany(() => HotelService, hotelService => hotelService.service)
  hotelServices: HotelService[]
}
