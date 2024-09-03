import { Entity, Column, OneToMany } from 'typeorm'
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

import { EntityBase } from '../../../common/entities/base.entity'
import { HotelImg } from '../../hotel-img/entities/hotel-img.entity'
import { HotelService } from '../../hotel-service/entities/hotel-service.entity'

@Entity({ name: 'hotel' })
export class Hotel extends EntityBase {
  @ApiProperty({ description: 'Nombre del hotel', required: true })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string

  @ApiProperty({ description: 'URL de la imagen del cover de la sección HOTEL' })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'text', nullable: false })
  imgCoverPath: string

  @ApiProperty({ description: 'URL de la imagen del cover' })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'text', nullable: false })
  imgCoverThumbPath: string

  @ApiProperty({ description: 'Título de la sección', required: true })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'varchar', length: 255, nullable: false, default: 'El Complejo' })
  sectionTitle: string

  @ApiProperty({ description: 'Dirección del hotel', required: true })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'varchar', length: 255, nullable: false })
  address: string

  @ApiProperty({ description: 'Teléfono de contacto del hotel', required: true })
  @IsString()
  @MaxLength(20)
  @Column({ type: 'varchar', length: 20, nullable: false })
  phone: string

  @ApiProperty({ description: 'Descripción del hotel', required: true })
  @IsString()
  @MaxLength(1000)
  @Column({ type: 'text', nullable: false })
  description: string

  @ApiProperty({ description: 'Número de WhatsApp del hotel' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  @Column({ type: 'varchar', length: 20, nullable: true })
  whatsapp?: string

  //Instagram
  @ApiProperty({ description: 'Instagram del hotel' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  @Column({ type: 'varchar', length: 255, nullable: true })
  instagram?: string

  //Facebook opcional
  @ApiProperty({ description: 'Facebook del hotel' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  @Column({ type: 'varchar', length: 255, nullable: true })
  facebook?: string

  @ApiProperty({ description: 'Coordenadas GPS del hotel' })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'varchar', length: 255, nullable: true })
  gpsCoords: string

  @ApiProperty({ description: 'Correo electrónico de contacto del hotel', required: true })
  @IsEmail()
  @MaxLength(255)
  @Column({ type: 'varchar', length: 255, nullable: false })
  email: string

  @OneToMany(() => HotelService, hotelService => hotelService.hotel, { cascade: true })
  hotelServices: HotelService[]

  @OneToMany(() => HotelImg, hotelImg => hotelImg.hotel)
  hotelImgs: HotelImg[]
}
