import { Entity } from 'typeorm'

import { EntityBase } from '../../../common/entities/base.entity'

@Entity({ name: 'quote_template_block' })
export class QuoteTemplateBlock extends EntityBase {}
