import { Entity, Column } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsString } from 'class-validator'

import { EntityBase } from '../../../common/entities/base.entity'

export enum ContentBlockType {
  GREETING = 'GREETING',
  SERVICES = 'SERVICES',
  TERMS = 'TERMS',
  CANCELLATION_POLICY = 'CANCELLATION_POLICY',
  FOOTER = 'FOOTER',
  GENERAL_INFO = 'GENERAL_INFO'
}

@Entity({ name: 'content_block' })
export class ContentBlock extends EntityBase {
  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({
    description: 'Nombre interno del bloque de contenido',
    example: 'Servicios Verano 2025'
  })
  @IsString()
  name: string

  @Column({ type: 'text' })
  @ApiProperty({
    description: 'Contenido del bloque de texto',
    example: 'Bienvenido a nuestro hotel...'
  })
  @IsString()
  content: string

  @Column({ type: 'enum', enum: ContentBlockType })
  @ApiProperty({
    description: 'Tipo de bloque de contenido',
    enum: ContentBlockType,
    example: ContentBlockType.GREETING
  })
  @IsEnum(ContentBlockType)
  type: ContentBlockType
}
