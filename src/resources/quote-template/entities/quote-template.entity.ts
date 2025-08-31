import { Entity, Column, OneToMany } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsString } from 'class-validator'

import { EntityBase } from '../../../common/entities/base.entity'
import { QuoteTemplateBlock } from '../../quote-template-block/entities/quote-template-block.entity'

@Entity({ name: 'quote_template' })
export class QuoteTemplate extends EntityBase {
  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({
    description: 'Nombre de la plantilla de presupuesto',
    example: 'Presupuesto Estándar WhatsApp'
  })
  @IsString()
  name: string

  @Column({ type: 'boolean', default: false })
  @ApiProperty({
    description: 'Indica si es la plantilla por defecto',
    example: false
  })
  @IsBoolean()
  isDefault: boolean

  @OneToMany(() => QuoteTemplateBlock, (quoteTemplateBlock) => quoteTemplateBlock.quoteTemplate)
  quoteTemplateBlocks: QuoteTemplateBlock[]
}
