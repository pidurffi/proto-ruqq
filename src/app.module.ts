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
import { HotelModule } from './resources/hotel/hotel.module'
import { HotelImgModule } from './resources/hotel-img/hotel-img.module'
import { RoomModule } from './resources/room/room.module'
import { RoomEquipmentModule } from './resources/room-equipment/room-equipment.module'
import { EquipmentModule } from './resources/equipment/equipment.module'
import { RoomImgModule } from './resources/room-img/room-img.module'
import { SectionModule } from './resources/section/section.module'
import { BannerModule } from './resources/banner/banner.module'
import { SectionImgModule } from './resources/section-img/section-img.module'
import { MetatagsModule } from './resources/metatags/metatags.module'
import { DeployModule } from './common/deploy/deploy.module'
import { ContactFormModule } from './resources/contact-form/contact-form.module'
import { ServiceModule } from './resources/service/service.module'
import { HotelServiceModule } from './resources/hotel-service/hotel-service.module'
import { PopupModule } from './resources/popup/popup.module'
//ImportTemplateModule
//NO BORRAR LA LINEA DE ARRIBA

// Cargar el archivo JSON de configuración
const loadJsonConfig = () => {
  const configPath = join(__dirname, '..', 'config.json')
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
        const staticUploadsPath = configService.get<string>('STATIC_UPLOADS_PATH')
        const staticServeRoot = configService.get<string>('STATIC_SERVE_ROOT')

        if (!staticUploadsPath) {
          throw new Error('STATIC_UPLOADS_PATH is not defined in the environment variables')
        }
        if (!staticServeRoot) {
          throw new Error('STATIC_SERVE_ROOT is not defined in the environment variables')
        }

        /*  */
        // const staticUploadsPath = process.env.STATIC_UPLOADS_PATH || '/static/uploads'
        // const staticServeRoot = process.env.STATIC_SERVE_ROOT || '/public'
        /* */

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
    HotelModule,
    HotelImgModule,
    RoomModule,
    RoomEquipmentModule,
    EquipmentModule,
    RoomImgModule,
    SectionModule,
    BannerModule,
    SectionImgModule,
    MetatagsModule,
    DeployModule,
    ContactFormModule,
    ServiceModule,
    HotelServiceModule,
    PopupModule,
    PopupModule,
    //TemplateModule
    //NO BORRAR LA LINEA DE ARRIBA
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
