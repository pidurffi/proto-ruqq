import { Column, Entity, ManyToOne } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength } from 'class-validator'

import { EntityBase } from '../../../common/entities/base.entity'
import { Section } from '../../section/entities/section.entity'

@Entity()
export class SectionImg extends EntityBase {
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

  @ManyToOne(() => Section, section => section.sectionImgs, { onDelete: 'CASCADE' })
  section: Section
}
