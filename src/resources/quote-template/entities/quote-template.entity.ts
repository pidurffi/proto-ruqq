import { Entity } from 'typeorm'

import { EntityBase } from '../../../common/entities/base.entity'

@Entity({ name: 'quote_template' })
export class QuoteTemplate extends EntityBase {}
