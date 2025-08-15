// common.module.ts
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ConsoleLogger, Module } from '@nestjs/common'

import { PaginationDto, EpGenericErrorDto } from './'
import { WinstonLoggerService } from './services/winston-logger.service'
import { AuditInterceptor } from './interceptors/audit.interceptor'
import { MailerController } from './mailer/mailer.controller'
import { MailerService } from './mailer/mailer.service'
import { UploadsHandleService } from './uploads-handle/uploads-handle.service'
import { UploadsConfigService } from './uploads-handle/uploads-handle.config'

@Module({
  imports: [ConfigModule],
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
  ],
  exports: [
    UploadsConfigService,
    UploadsHandleService,
    PaginationDto,
    EpGenericErrorDto,
    MailerService,
    WinstonLoggerService,
    AuditInterceptor,
  ],
})
export class CommonModule {}
