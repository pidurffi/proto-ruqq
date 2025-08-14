import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'

import { WinstonLoggerService } from './winston-logger.service'
import { DberrorsDto } from '../dto/dberrors.dto'

@Injectable()
export class BaseService {
  constructor(protected readonly logger: WinstonLoggerService) {}

  protected async handleDBErrors(dberrors: DberrorsDto): Promise<never> {
    const { error, errorsToCheck, context } = dberrors

    if (errorsToCheck.includes(error.code)) {
      await this.logger.error({
        message: error.detail,
        sendEmail: false,
        stack: BadRequestException.name,
        context,
      })
      throw new BadRequestException(error.detail)
    }
    await this.logger.error({
      message: error,
      sendEmail: false,
      stack: BadRequestException.name,
      context,
    })
    throw new InternalServerErrorException('Please check logs')
  }
}
