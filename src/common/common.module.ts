// common.module.ts
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ConsoleLogger, Module } from '@nestjs/common'

import { EploggerService, PaginationDto, EpGenericErrorDto } from './'
import { EpmailerController } from './mailer/mailer.controller'
import { EpmailerService } from './mailer/mailer.service'
import { UploadsHandleService } from './uploads-handle/uploads-handle.service'
import { UploadsConfigService } from './uploads-handle/uploads-handle.config'

@Module({
  imports: [ConfigModule],
  controllers: [EpmailerController],
  providers: [
    // TODO: Hacer UploadsModule ????
    UploadsHandleService,
    UploadsConfigService,
    ConfigService,
    EploggerService,
    ConsoleLogger,
    PaginationDto,
    EpGenericErrorDto,
    EpmailerService,
  ],
  exports: [
    UploadsConfigService,
    UploadsHandleService,
    EploggerService,
    PaginationDto,
    EpGenericErrorDto,
    EpmailerService,
  ],
})
export class CommonModule {}
