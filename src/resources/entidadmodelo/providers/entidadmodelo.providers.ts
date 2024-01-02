import { DataSource } from 'typeorm'

import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'
import { Entidadmodelo } from '../entities/entidadmodelo.entity'

export const EntidadmodeloProviders = [
  {
    provide: repositories.ENTIDAD_MODELO_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Entidadmodelo),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
