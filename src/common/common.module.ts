import { ConfigModule, ConfigService } from '@nestjs/config'
import { ConsoleLogger, Module } from '@nestjs/common'

import { EploggerService, PaginationDto, EpGenericErrorDto } from './'

@Module({
  imports: [ConfigModule],
  providers: [ConfigService, EploggerService, ConsoleLogger, PaginationDto, EpGenericErrorDto],
  exports: [EploggerService, PaginationDto, EpGenericErrorDto],
})
export class CommonModule {}
