import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'

import { BaseEntityService } from './base-entity.service'
import { WinstonLoggerService } from './winston-logger.service'
import { EntityBase } from '../entities/base.entity'
import { DberrorsDto, EpGenericErrorDto } from '../dto'
import { EpExceptionError } from '../dto/epErrors.dto'

@Injectable()
export abstract class LoggableEntityService<T extends EntityBase> extends BaseEntityService<T> {
  constructor(protected readonly logger: WinstonLoggerService) {
    super()
  }

  protected async handleErrors(
    error: EpGenericErrorDto | EpExceptionError | unknown,
    context = 'Errors',
    sendEmail = false,
    errorsToCheck: string[] = [],
  ) {
    if (error && error.hasOwnProperty('status')) {
      const e = error as EpExceptionError
      await this.logger.error({
        message: `${e.response.message} [${e.status}]`,
        sendEmail,
        stack: BadRequestException.name,
        context,
      })
      throw new BadRequestException(e.response.message)
    } else {
      const dbError = error as EpGenericErrorDto
      if (dbError.code === '23505') {
        const errorMessage = `Un elemento con el nombre especificado ya existe.`
        await this.logger.error({
          message: errorMessage,
          sendEmail,
          stack: BadRequestException.name,
          context,
        })
        throw new BadRequestException(errorMessage)
      }

      await this.handleDBErrors({ error: dbError, errorsToCheck, context })
    }
  }

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