import { DataSourceOptions } from 'typeorm'
import * as dotenv from 'dotenv'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'
import { join } from 'path'

/// Definir la ruta del archivo .env
const envPath = join(__dirname, '../..', '.env')
dotenv.config({ path: envPath })

const config: DataSourceOptions[] = [
  {
    type: 'postgres',
    host: process.env.PG_DB_HOST,
    port: +process.env.PG_DB_PORT!,
    database: process.env.PG_DB_NAME,
    username: process.env.PG_DB_USERNAME,
    password: process.env.PG_DB_PASSWORD,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'], //esto es para interprete de donde levantar la info de entidades para armar las migrations
    synchronize: process.env.PG_DB_SYNCHRONIZE == 'true',
    migrations: [__dirname + '/../engine/migrations/**/*{.ts,.js}'], //esto es para lea de esta carpeta (no es para guarde)
    migrationsRun: false,
    logging: process.env.DB_LOGGING == 'true',
    //logging: true,
    logger: 'advanced-console',
    namingStrategy: new SnakeNamingStrategy(),
  } as DataSourceOptions,
  // {
  //  type: 'mysql',
  //  host: process.env.MY_DB_HOST,
  //  port: +process.env.MY_DB_PORT!,
  //  database: process.env.MY_DB_NAME,
  //  username: process.env.MY_DB_USERNAME,
  //  password: process.env.MY_DB_PASSWORD,
  //  insecureAuth: true,
  //  entities: [__dirname + '/../product/**/*.entity{.ts,.js}'],
  //  synchronize: process.env.MY_DB_SYNCHRONIZE == 'true',
  //} as DataSourceOptions,
]
export { config }

//dotenv.config();
//https://stackoverflow.com/questions/51994541/nestjs-typeorm-use-two-or-more-databases
/* export = [
  {
    name: 'db_posgres',
    type: 'postgres',
    host: process.env.PG_DB_HOST,
    port: +process.env.PG_DB_PORT,
    database: process.env.PG_DB_NAME,
    username: process.env.PG_DB_USERNAME,
    password: process.env.PG_DB_PASSWORD,      
    autoLoadEntities: true,
    synchronize: true,
    options: {
      instanceName: process.env.PG_DB_INSTANCE,
      enableArithAbort: false,
    },
    logging: parseBoolean(process.env.PG_DB_LOGGING),
    dropSchema: false,
    migrationsRun: parseBoolean(process.env.PG_DB_RUN_MIGRATIONS),
    migrations: [join(__dirname, '..', 'model/migration/*.{ts,js}')],
    cli: {
      migrationsDir: '../model/migration',
    },
    entities: [
      join(__dirname, '..', 'model/entity/default/*.entity.{ts,js}'),
/*    ],
  } as TypeOrmModuleOptions,
  {
    name: 'other',
    type: 'mssql',
    host: process.env.OTHER_DB_HOST,
    username: process.env.OTHER_DB_USERNAME,
    password: process.env.OTHER_DB_PASSWORD,
    database: process.env.OTHER_DB_NAME,
    options: {
      instanceName: process.env.OTHER_DB_INSTANCE,
      enableArithAbort: false,
    },
    logging: parseBoolean(process.env.OTHER_DB_LOGGING),
    dropSchema: false,
    synchronize: false,
    migrationsRun: false,
    entities: [],
  } as TypeOrmModuleOptions,
]; */
