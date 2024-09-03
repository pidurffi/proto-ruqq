import { Entity, Column } from 'typeorm'
import { IsString, MaxLength, IsBoolean, IsDate, IsInt, Min, IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

import { EntityBase } from '../../../common/entities/base.entity'

@Entity({ name: 'banner' })
export class Banner extends EntityBase {
  @ApiProperty({ description: 'URL de la imagen del banner' })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'text', nullable: true })
  imgPath?: string

  @ApiProperty({ description: 'URL de la imagen del thumb del banner' })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'text', nullable: true })
  thumbPath?: string

  @ApiProperty({ description: 'Título del banner' })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'text', nullable: false, unique: true })
  title: string

  @ApiProperty({ description: 'Subtítulo del banner' })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'text', nullable: true })
  subtitle: string

  @ApiProperty({ description: 'Descripción del banner' })
  @IsString()
  @MaxLength(1000)
  @Column({ type: 'text', nullable: false })
  description: string

  @ApiProperty({ description: 'Indica si el botón está habilitado' })
  @IsBoolean()
  @Column({ type: 'boolean', nullable: false })
  buttonEnabled: boolean

  @ApiProperty({ description: 'Indica si el banner es genérico o es una promo' })
  @IsBoolean()
  @Column({ type: 'boolean', nullable: false })
  isPromo: boolean

  @ApiProperty({ description: 'Texto del botón' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Column({ type: 'text', nullable: true })
  buttonText?: string

  @ApiProperty({ description: 'Enlace del botón' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Column({ type: 'text', nullable: true })
  buttonLink?: string

  @ApiProperty({ description: 'Fecha de inicio de la visibilidad del banner' })
  @IsOptional()
  @IsDate()
  @Column({ type: 'date', nullable: true })
  dateIn?: Date

  @ApiProperty({ description: 'Fecha de fin de la visibilidad del banner' })
  @IsOptional()
  @IsDate()
  @Column({ type: 'date', nullable: true })
  dateOut?: Date

  @ApiProperty({ description: 'Indica si el banner está habilitado' })
  @IsBoolean()
  @Column({ type: 'boolean', nullable: false })
  enabled: boolean

  @ApiProperty({ description: 'Orden en el que se muestran las promos' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Column({ type: 'integer', nullable: true })
  order?: number
}
