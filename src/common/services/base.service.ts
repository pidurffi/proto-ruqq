import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'

import { EploggerService } from './eplogger.service'
import { DberrorsDto } from '../dto/dberrors.dto'

@Injectable()
export class BaseService {
  constructor(protected readonly logger: EploggerService) {}

  protected handleDBErrors(dberrors: DberrorsDto): never {
    const { error, errorsToCheck, context } = dberrors

    if (errorsToCheck.includes(error.code)) {
      this.logger.error({
        message: error.detail,
        sendEmail: false,
        stack: BadRequestException.name,
        context,
      })
      throw new BadRequestException(error.detail)
    }
    this.logger.error({
      message: error,
      sendEmail: false,
      stack: BadRequestException.name,
      context,
    })
    throw new InternalServerErrorException('Please check logs')
  }
}
