import { ConsoleLogger, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { ArgumentsLogger } from '../interfaces/argumentslogger.interface'

@Injectable()
export class EploggerService {
  private context = 'LoggerService'

  constructor(private configService: ConfigService, private readonly logger: ConsoleLogger) {}

  setContext(context: string) {
    this.context = context
  }

  log(args: ArgumentsLogger): void {
    const { message, context = this.context } = args
    this.logger.log(message, context)
  }

  error(args: ArgumentsLogger) {
    const { message, context = this.context, stack } = args
    this.logger.error(message, stack, context)
  }

  warn(args: ArgumentsLogger): void {
    const { message, context = this.context } = args
    this.logger.warn(message, context)
  }

  debug(args: ArgumentsLogger): void {
    const { message, context = this.context } = args
    this.logger.debug(message, context)
  }

  verbose(args: ArgumentsLogger): void {
    const { message, context = this.context } = args
    this.logger.verbose(message, context)
  }
}
