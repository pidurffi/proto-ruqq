// typeorm.config.ts
import { DataSource } from 'typeorm'

import ormconfig = require('./ormconfig') //path mapping doesn't work here

const [postg] = ormconfig
export const dataSourcePostgres = new DataSource(postg)
