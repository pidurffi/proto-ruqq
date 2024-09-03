import { Column, Entity } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsString, MaxLength } from 'class-validator'

import { EntityBase } from '../../../common/entities/base.entity'

@Entity()
export class Popup extends EntityBase {
  @ApiProperty({ description: 'Nombre del hotel', required: true })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'varchar', length: 255, nullable: false, default: 'popup' })
  name: string

  @ApiProperty({ description: 'Indica si el popup está habilitado' })
  @IsBoolean()
  @Column({ type: 'boolean', nullable: false })
  enabled: boolean

  @ApiProperty({ description: 'Título del banner', required: true })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string

  @ApiProperty({ description: 'Título del banner', required: true })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'varchar', length: 255, nullable: false })
  text: string

  @ApiProperty({ description: 'URL de la imagen del popup' })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'text', nullable: false })
  imgPath: string

  @ApiProperty({ description: 'URL de la imagen del cover' })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'text', nullable: false })
  imgThumbPath: string
}
