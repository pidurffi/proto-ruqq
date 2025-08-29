// app.module.ts
import { join } from 'path'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ServeStaticModule } from '@nestjs/serve-static'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { CommonModule } from './common/common.module'
import { AuthModule } from './engine/auth/auth.module'
import { DatabaseModule } from './engine/database/database.module'

import { RoomTypeModule } from './resources/room-type/room-type.module';
import { BaseRatePeriodModule } from './resources/base-rate-period/base-rate-period.module';
import { OccupancyRateModifiersModule } from './resources/occupancy-rate-modifiers/occupancy-rate-modifiers.module';
//ImportTemplateModule
//NO BORRAR LA LINEA DE ARRIBA

// Cargar el archivo JSON de configuración
const loadJsonConfig = () => {
  const configPath = join(__dirname, '..', '..', 'config.json')
  return require(configPath)
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '.env'),
      // Aca se carga el archivo JSON de configuración
      load: [loadJsonConfig],
    }),
    DatabaseModule,
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uploadsConfig = configService.get('uploads')
        const staticUploadsPath = uploadsConfig?.general?.staticUploadsPath
        const staticServeRoot = uploadsConfig?.general?.staticServeRoot

        if (!staticUploadsPath) {
          throw new Error('staticUploadsPath is not defined in the uploads configuration')
        }
        if (!staticServeRoot) {
          throw new Error('staticServeRoot is not defined in the uploads configuration')
        }

        return [
          {
            rootPath: join(__dirname, '..', staticUploadsPath),
            serveRoot: staticServeRoot,
          },
        ]
      },
      inject: [ConfigService],
    }),
    AuthModule,
    CommonModule,

    RoomTypeModule,
    BaseRatePeriodModule,
    OccupancyRateModifiersModule,
    //TemplateModule
    //NO BORRAR LA LINEA DE ARRIBA
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
