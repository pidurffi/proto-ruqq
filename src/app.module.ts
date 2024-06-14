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

//ImportTemplateModule
//NO BORRAR LA LINEA DE ARRIBA

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '.env'),
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
    //TemplateModule
    //NO BORRAR LA LINEA DE ARRIBA
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
