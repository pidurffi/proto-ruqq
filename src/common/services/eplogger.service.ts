import { ConsoleLogger, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { ArgumentsLogger } from '../interfaces/argumentslogger.interface'
import { SendMailDto } from '../dto/sendmail.dto'
import { EpmailerService } from './epmailer.service'

@Injectable()
export class EploggerService {
  private context = 'LoggerService'

  constructor(
    private configService: ConfigService,
    private readonly mailerservice: EpmailerService,
    private readonly logger: ConsoleLogger,
  ) {}

  setContext(context: string) {
    this.context = context
  }

  log(args: ArgumentsLogger): void {
    const { message, context = this.context } = args

    this.sendMail(args, 'LOG')

    this.logger.log(message, context)
  }

  error(args: ArgumentsLogger) {
    const { message, context = this.context, stack } = args
    this.sendMail(args, 'ERROR')
    this.logger.error(message, stack, context)
  }

  warn(args: ArgumentsLogger): void {
    const { message, context = this.context } = args
    this.sendMail(args, 'WARN')

    this.logger.warn(message, context)
  }

  debug(args: ArgumentsLogger): void {
    const { message, context = this.context } = args
    this.sendMail(args, 'DEBUG')

    this.logger.debug(message, context)
  }

  verbose(args: ArgumentsLogger): void {
    const { message, context = this.context } = args
    this.sendMail(args, 'VERBOSE')

    this.logger.verbose(message, context)
  }

  private sendMail(args: ArgumentsLogger, typeLog: string) {
    const { message, context = this.context, sendEmail } = args
    if (sendEmail) {
      const entorno = this.configService.get<string>('ENVIRONMENT')
      const mailinfo: SendMailDto = {
        message,
        subject: `[${entorno}][${typeLog}] ${Date()}`,
        sendto: this.configService.get<string>(`MAIL_${typeLog}`),
      }
      try {
        this.mailerservice.enviar(mailinfo)
      } catch (error) {
        this.logger.error(error, context)
      }
    }
  }
}
