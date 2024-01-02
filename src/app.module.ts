import { join } from 'path'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ServeStaticModule } from '@nestjs/serve-static'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { CommonModule } from './common/common.module'
import { AuthModule } from './engine/auth/auth.module'
import { DatabaseModule } from './engine/database/database.module'
import { EntidadmodeloModule } from './resources/entidadmodelo/entidadmodelo.module'
import { EntidadRelacionModule } from './resources/entidad-relacion/entidad-relacion.module'

//ImportTemplateModule
//NO BORRAR LA LINEA DE ARRIBA

@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    AuthModule,
    CommonModule,
    EntidadmodeloModule,
    EntidadRelacionModule,
    //TemplateModule
    //NO BORRAR LA LINEA DE ARRIBA
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
