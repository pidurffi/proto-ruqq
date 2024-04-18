import { join } from 'path'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ServeStaticModule } from '@nestjs/serve-static'
import { MailerModule, MailerOptions } from '@nestjs-modules/mailer'

import { mailerconfig } from './config/mailerconfig'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { CommonModule } from './common/common.module'
import { AuthModule } from './engine/auth/auth.module'
import { DatabaseModule } from './engine/database/database.module'

//ImportTemplateModule
//NO BORRAR LA LINEA DE ARRIBA

@Module({
  imports: [
    ConfigModule.forRoot(),
    MailerModule.forRoot(mailerconfig as MailerOptions),
    DatabaseModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
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
