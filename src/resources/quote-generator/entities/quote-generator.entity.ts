import { Entity } from 'typeorm'

import { EntityBase } from '../../../common/entities/base.entity'

@Entity({ name: 'quote_generator' })
export class QuoteGenerator extends EntityBase {}
