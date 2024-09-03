import { Entity, Column } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsOptional, MaxLength } from 'class-validator'

import { EntityBase } from '../../../common/entities/base.entity'

@Entity({ name: 'meta_data' })
export class Metatags extends EntityBase {
  @ApiProperty({ description: 'Título de la página', required: true })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string

  @ApiProperty({ description: 'Descripción de la página', required: true })
  @IsString()
  @MaxLength(500)
  @Column({ type: 'varchar', length: 500, nullable: false })
  description: string

  @ApiProperty({ description: 'Palabras clave de la página', required: false })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  @Column({ type: 'varchar', length: 255, nullable: true })
  keywords: string

  @ApiProperty({ description: 'URL canónica', required: false })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  @Column({ type: 'varchar', length: 255, nullable: true })
  canonicalUrl: string

  @ApiProperty({ description: 'Título para Open Graph', required: false })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  @Column({ type: 'varchar', length: 255, nullable: true })
  ogTitle: string

  @ApiProperty({ description: 'Descripción para Open Graph', required: false })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  @Column({ type: 'varchar', length: 500, nullable: true })
  ogDescription: string

  @ApiProperty({ description: 'Imagen para Open Graph', required: false })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  @Column({ type: 'varchar', length: 255, nullable: true })
  ogImage: string

  @ApiProperty({ description: 'URL para Open Graph', required: false })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  @Column({ type: 'varchar', length: 255, nullable: true })
  ogUrl: string

  @ApiProperty({ description: 'Título para Twitter Card', required: false })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  @Column({ type: 'varchar', length: 255, nullable: true })
  twitterTitle: string

  @ApiProperty({ description: 'Descripción para Twitter Card', required: false })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  @Column({ type: 'varchar', length: 500, nullable: true })
  twitterDescription: string

  @ApiProperty({ description: 'Imagen para Twitter Card', required: false })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  @Column({ type: 'varchar', length: 255, nullable: true })
  twitterImage: string

  @ApiProperty({ description: 'Instrucciones para motores de búsqueda', required: false })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  @Column({ type: 'varchar', length: 255, nullable: true })
  robots: string

  //   @ApiProperty({ description: 'Datos estructurados en formato JSON-LD', required: false })
  //   @IsJSON()
  //   @IsOptional()
  //   @Column({ type: 'jsonb', nullable: true })
  //   structuredData: Record<string, any>

  //   @ApiProperty({ description: 'Versión de los metadatos', required: false })
  //   @Column({ type: 'int', default: 1 })
  //   version: number

  //   @ApiProperty({ description: 'Idioma de los metadatos', required: false })
  //   @IsString()
  //   @MaxLength(5)
  //   @IsOptional()
  //   @Column({ type: 'varchar', length: 5, nullable: true })
  //   language: string

  //   @ApiProperty({ description: 'Tipo de página para personalizar metadatos', required: false })
  //   @IsString()
  //   @MaxLength(255)
  //   @IsOptional()
  //   @Column({ type: 'varchar', length: 255, nullable: true })
  //   pageType: string

  //   @ApiProperty({ description: 'Configuraciones para herramientas de análisis', required: false })
  //   @IsJSON()
  //   @IsOptional()
  //   @Column({ type: 'jsonb', nullable: true })
  //   analytics: Record<string, any>

  //   @ApiProperty({ description: 'Datos específicos para AMP', required: false })
  //   @IsJSON()
  //   @IsOptional()
  //   @Column({ type: 'jsonb', nullable: true })
  //   ampData: Record<string, any>

  //   @ApiProperty({ description: 'Políticas de caché y expiración', required: false })
  //   @IsString()
  //   @MaxLength(255)
  //   @IsOptional()
  //   @Column({ type: 'varchar', length: 255, nullable: true })
  //   cacheControl: string
}
