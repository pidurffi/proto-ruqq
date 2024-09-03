import { Entity, Column, ManyToOne } from 'typeorm'
import { IsString, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

import { EntityBase } from '../../../common/entities/base.entity'
import { Hotel } from '../../hotel/entities/hotel.entity'

@Entity({ name: 'hotel_img' })
export class HotelImg extends EntityBase {
  @ApiProperty({ description: 'Ruta del archivo de la imagen', required: true })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'varchar', length: 255, nullable: false })
  imgPath: string

  @ApiProperty({ description: 'Ruta del archivo de la imagen', required: true })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'varchar', length: 255, nullable: false })
  imgThumbPath: string

  @ManyToOne(() => Hotel, hotel => hotel.hotelImgs)
  hotel: Hotel
}
