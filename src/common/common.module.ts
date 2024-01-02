import { ConfigModule, ConfigService } from '@nestjs/config'
import { ConsoleLogger, Module } from '@nestjs/common'
import * as Excel from 'exceljs'

import { EploggerService, EpxlsService, PaginationDto, SendMailDto, XlsDto, EpGenericErrorDto } from './'

@Module({
  imports: [ConfigModule],
  providers: [
    ConfigService,
    EploggerService,
    ConsoleLogger,
    EpxlsService,
    PaginationDto,
    XlsDto,
    SendMailDto,
    EpGenericErrorDto,
    Excel.Workbook,
  ],
  exports: [SendMailDto, EploggerService, PaginationDto, XlsDto, EpxlsService, EpGenericErrorDto],
})
export class CommonModule {}
