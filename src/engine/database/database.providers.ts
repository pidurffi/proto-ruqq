//import { DataSource } from 'typeorm'

//import ormconfig = require('../../config/ormconfig') //path mapping doesn't work here
import { resources } from './constants'
import { dataSourcePostgres } from '../../config/typeorm.config'

export const databaseProviders = [
  {
    provide: resources.DATA_SOURCE_POSTGRES,
    useFactory: async () => {
      //const dataSource = new DataSource(dataSourceOption)

      return dataSourcePostgres.initialize()
    },
  },
]
