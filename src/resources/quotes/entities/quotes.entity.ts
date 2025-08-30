import { Entity } from 'typeorm'

import { EntityBase } from '../../../common/entities/base.entity'

@Entity({ name: 'quotes' })
export class Quotes extends EntityBase {}
