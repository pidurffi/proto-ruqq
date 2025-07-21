// typeorm.config.ts
import { DataSource } from 'typeorm'
import { config } from './ormconfig'

const [postg] = config
const dataSource = new DataSource(postg)
export const dataSourcePostgres = dataSource
export default dataSource
