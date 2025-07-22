import { Entity } from 'typeorm'

import { EntityBase } from '../../../../common/entities/base.entity'

@Entity({ name: 'template' })
export class Template extends EntityBase {}
