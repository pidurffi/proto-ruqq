import { DataSource } from 'typeorm'

import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'
import { EntidadRelacion } from '../entities/entidad-relacion.entity'

export const EntidadRelacionProviders = [
  {
    provide: repositories.ENTIDAD_RELACION_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(EntidadRelacion),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
