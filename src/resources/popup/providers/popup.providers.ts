import { DataSource } from 'typeorm'

import { Popup } from '../entities/popup.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const PopupProviders = [
  {
    provide: repositories.POPUP_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Popup),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
