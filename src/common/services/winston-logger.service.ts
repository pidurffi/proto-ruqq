import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as winston from 'winston'
import 'winston-daily-rotate-file'

import { ArgumentsLogger } from '../interfaces/argumentslogger.interface'
import { IAuditLogger } from '../interfaces/logger.interface'
import { SendMailDto } from '../mailer/sendmail.dto'
import { EpmailerService } from '../mailer/mailer.service'

@Injectable()
export class WinstonLoggerService implements IAuditLogger {
  private logger: winston.Logger
  private context = 'WinstonLogger'

  constructor(
    private configService: ConfigService,
    private readonly mailerservice: EpmailerService,
  ) {
    this.logger = winston.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [
        // Console transport for development
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'MM/DD/YYYY, HH:mm:ss A' }),
            winston.format.printf(({ level, message, timestamp, context, stack }) => {
              const ctx = context ? `[${context}]` : ''
              const stackTrace = stack ? ` - ${stack}` : ''
              return `[Nest] ${process.pid} - ${timestamp} ${level.toUpperCase()} ${ctx} ${message}${stackTrace}`
            }),
          ),
        }),

        // Daily rotating file for all logs
        new winston.transports.DailyRotateFile({
          filename: 'logs/app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),

        // Separate file for errors only
        new winston.transports.DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '30d',
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),

        // Audit log for CREATE/UPDATE/DELETE operations
        new winston.transports.DailyRotateFile({
          filename: 'logs/audit-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '90d', // Keep audit logs longer
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
          level: 'info',
        }),
      ],
    })
  }

  setContext(context: string) {
    this.context = context
  }

  async log(args: ArgumentsLogger): Promise<void> {
    const { message, context = this.context } = args

    await this.sendMail(args, 'LOG')

    this.logger.info(message, { context })
  }

  async error(args: ArgumentsLogger): Promise<void> {
    const { message, context = this.context, stack } = args

    await this.sendMail(args, 'ERROR')

    this.logger.error(message, {
      context,
      stack: stack || new Error().stack,
    })
  }

  async warn(args: ArgumentsLogger): Promise<void> {
    const { message, context = this.context } = args

    await this.sendMail(args, 'WARN')

    this.logger.warn(message, { context })
  }

  async debug(args: ArgumentsLogger): Promise<void> {
    const { message, context = this.context } = args

    await this.sendMail(args, 'DEBUG')

    this.logger.debug(message, { context })
  }

  async verbose(args: ArgumentsLogger): Promise<void> {
    const { message, context = this.context } = args

    await this.sendMail(args, 'VERBOSE')

    this.logger.verbose(message, { context })
  }

  // New method for audit logging
  audit(operation: 'CREATE' | 'UPDATE' | 'DELETE', entity: string, id: string, uid: string, data?: any): void {
    const auditData = {
      operation,
      entity,
      id,
      uid,
      timestamp: new Date().toISOString(),
      data,
    }

    this.logger.info(`AUDIT: ${operation} ${entity} ${id} by ${uid}`, {
      auditData,
    })
  }

  private async sendMail(args: ArgumentsLogger, typeLog: string) {
    const { message, sendEmail } = args
    if (sendEmail) {
      const entorno = this.configService.get<string>('ENVIRONMENT')
      const emailTo = this.configService.get<string>(`MAIL_${typeLog}`)
      
      if (!emailTo) {
        this.logger.warn(`Email configuration MAIL_${typeLog} not found`, {
          context: 'WinstonLoggerService',
        })
        return
      }

      const mailinfo: SendMailDto = {
        sendTo: emailTo,
        replyTo: emailTo,
        subject: `[${entorno}][${typeLog}] ${Date()}`,
        message: String(message),
      }
      try {
        await this.mailerservice.sendMail(mailinfo)
      } catch (error) {
        this.logger.error('Failed to send email notification', {
          context: 'WinstonLoggerService',
          error: error instanceof Error ? error.message : String(error),
          originalMessage: message,
        })
      }
    }
  }
}
