// typeorm.cli.config.ts - Configuración específica para CLI de TypeORM
import { DataSource } from 'typeorm'
import { config } from './src/config/ormconfig'

const [postg] = config
export default new DataSource(postg)