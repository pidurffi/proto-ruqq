// common.module.ts
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ConsoleLogger, Module } from '@nestjs/common'
import { MailerModule } from '@nestjs-modules/mailer'
import { ThrottlerModule } from '@nestjs/throttler'

import mailerConfig from '../config/mailer.config'
import { PaginationDto, EpGenericErrorDto } from './'
import { WinstonLoggerService } from './services/winston-logger.service'
import { TenantService } from './services/tenant.service'
import { TenantMiddleware } from './middleware/tenant.middleware'
import { AuditInterceptor } from './interceptors/audit.interceptor'
import { MailerController } from './mailer/mailer.controller'
import { MailerService } from './mailer/mailer.service'
import { UploadsHandleService } from './uploads-handle/uploads-handle.service'
import { UploadsConfigService } from './uploads-handle/uploads-handle.config'

@Module({
  imports: [
    ConfigModule.forFeature(mailerConfig),
    MailerModule.forRootAsync({
      imports: [ConfigModule.forFeature(mailerConfig)],
      useFactory: (configService: ConfigService) => {
        const config = configService.get('mailer')
        console.log('Mailer config debug:', {
          host: config?.transport?.host,
          port: config?.transport?.port,
          user: config?.transport?.auth?.user
        })
        return config!
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          name: 'short',
          ttl: 60000, // 1 minute
          limit: 10, // max 10 requests per minute
        },
        {
          name: 'medium',
          ttl: 600000, // 10 minutes
          limit: 100, // max 100 requests per 10 minutes
        },
        {
          name: 'long',
          ttl: 3600000, // 1 hour
          limit: 1000, // max 1000 requests per hour
        },
      ],
      inject: [ConfigService],
    }),
  ],
  controllers: [MailerController],
  providers: [
    // TODO: Hacer UploadsModule ????
    UploadsHandleService,
    UploadsConfigService,
    ConfigService,
    ConsoleLogger,
    PaginationDto,
    EpGenericErrorDto,
    MailerService,
    WinstonLoggerService,
    AuditInterceptor,
    TenantService,
    TenantMiddleware,
  ],
  exports: [
    UploadsConfigService,
    UploadsHandleService,
    PaginationDto,
    EpGenericErrorDto,
    MailerService,
    WinstonLoggerService,
    AuditInterceptor,
    TenantService,
    TenantMiddleware,
  ],
})
export class CommonModule {}
