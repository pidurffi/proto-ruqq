import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsUUID } from 'class-validator'

import { EntityBase } from '../../../common/entities/base.entity'
import { QuoteTemplate } from '../../quote-template/entities/quote-template.entity'
import { ContentBlock } from '../../content-block/entities/content-block.entity'

@Entity({ name: 'quote_template_block' })
export class QuoteTemplateBlock extends EntityBase {
  @Column({ type: 'uuid', name: 'quote_template_id' })
  @ApiProperty({
    description: 'ID de la plantilla de presupuesto',
    type: String
  })
  @IsUUID()
  quoteTemplateId: string

  @Column({ type: 'uuid', name: 'content_block_id' })
  @ApiProperty({
    description: 'ID del bloque de contenido',
    type: String
  })
  @IsUUID()
  contentBlockId: string

  @Column({ type: 'integer', name: 'sort_order' })
  @ApiProperty({
    description: 'Orden del bloque en la plantilla',
    example: 1
  })
  @IsNumber()
  sortOrder: number

  @ManyToOne(() => QuoteTemplate, (quoteTemplate) => quoteTemplate.quoteTemplateBlocks)
  @JoinColumn({ name: 'quote_template_id' })
  quoteTemplate: QuoteTemplate

  @ManyToOne(() => ContentBlock)
  @JoinColumn({ name: 'content_block_id' })
  contentBlock: ContentBlock
}
