import { Entity, Column, OneToMany } from 'typeorm'
import { IsString, IsBoolean } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

import { EntityBase } from '../../../common/entities/base.entity'
import { SectionImg } from '../../section-img/entities/section-img.entity'

@Entity({ name: 'section' })
export class Section extends EntityBase {
  @ApiProperty({ description: 'Título del bloque de texto' })
  @IsString()
  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string

  @ApiProperty({ description: 'Texto del bloque de texto' })
  @IsString()
  @Column({ type: 'varchar', length: 1024, nullable: true })
  text: string

  @ApiProperty({ description: 'Indica si hay un botón asociado al bloque de texto' })
  @IsBoolean()
  @Column({ type: 'boolean', default: false })
  button: boolean

  @ApiProperty({ description: 'URL del botón, si aplica' })
  @IsString()
  @Column({ type: 'varchar', length: 512, nullable: true })
  buttonUrl: string

  @ApiProperty({ description: 'Texto del botón, si aplica' })
  @IsString()
  @Column({ type: 'varchar', length: 255, nullable: true })
  buttonText: string

  @OneToMany(() => SectionImg, sectionImg => sectionImg.section)
  sectionImgs: SectionImg[]
}
