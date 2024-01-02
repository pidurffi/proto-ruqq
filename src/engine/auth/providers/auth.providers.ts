import { DataSource } from 'typeorm'

import { User } from '../entities/user.entity'
import { resources } from '../../database/constants'
import { repositories } from '../constants'
import { Role } from '../entities'

export const AuthProviders = [
  {
    provide: repositories.AUTH_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(User),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
  {
    provide: repositories.ROLE_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Role),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
