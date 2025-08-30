import { Entity } from 'typeorm'

import { EntityBase } from '../../../common/entities/base.entity'

@Entity({ name: 'content_block' })
export class ContentBlock extends EntityBase {}
