// common.module.ts
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ConsoleLogger, Module } from '@nestjs/common'

import { EploggerService, PaginationDto, EpGenericErrorDto } from './'
import { EpmailerController } from './mailer/mailer.controller'
import { EpmailerService } from './mailer/mailer.service'

@Module({
  imports: [ConfigModule],
  controllers: [EpmailerController],
  providers: [ConfigService, EploggerService, ConsoleLogger, PaginationDto, EpGenericErrorDto, EpmailerService],
  exports: [EploggerService, PaginationDto, EpGenericErrorDto, EpmailerService],
})
export class CommonModule {}
