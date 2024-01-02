import { ConfigModule, ConfigService } from '@nestjs/config'
import { ConsoleLogger, Module } from '@nestjs/common'
import * as Excel from 'exceljs'

import {
  EpmailerController,
  EpmailerService,
  EploggerService,
  EpxlsService,
  PaginationDto,
  SendMailDto,
  XlsDto,
  EpGenericErrorDto,
} from './'

@Module({
  imports: [ConfigModule],
  controllers: [EpmailerController],
  providers: [
    ConfigService,
    EpmailerService,
    EploggerService,
    ConsoleLogger,
    EpxlsService,
    PaginationDto,
    XlsDto,
    SendMailDto,
    EpGenericErrorDto,
    Excel.Workbook,
  ],
  exports: [EpmailerService, SendMailDto, EploggerService, PaginationDto, XlsDto, EpxlsService, EpGenericErrorDto],
})
export class CommonModule {}
