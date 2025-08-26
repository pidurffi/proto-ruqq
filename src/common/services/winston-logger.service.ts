import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as winston from 'winston'
import 'winston-daily-rotate-file'

import { SendMailDto } from '../mailer/sendmail.dto'
import { MailerService } from '../mailer/mailer.service'

@Injectable()
export class WinstonLoggerService {
  private logger: winston.Logger
  private context = 'WinstonLogger'

  constructor(
    private configService: ConfigService,
    private readonly mailerservice: MailerService,
  ) {
    this.logger = winston.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
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
            })
          ),
        }),

        // Daily rotating file for all logs
        new winston.transports.DailyRotateFile({
          filename: 'logs/app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        }),

        // Separate file for errors only
        new winston.transports.DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '30d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        }),

        // Audit log for CREATE/UPDATE/DELETE operations
        new winston.transports.DailyRotateFile({
          filename: 'logs/audit-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '90d', // Keep audit logs longer
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
          level: 'info'
        })
      ]
    })
  }

  setContext(context: string) {
    this.context = context
  }

  async log(params: {
    message: any
    context?: string
    sendEmail?: boolean
  }): Promise<void> {
    const { message, context = this.context, sendEmail = false } = params

    if (sendEmail) {
      await this.sendMail(message, 'LOG')
    }

    this.logger.info(message, { context })
  }

  async error(params: {
    message: any
    context?: string
    stack?: string
    sendEmail?: boolean
  }): Promise<void> {
    const { message, context = this.context, stack, sendEmail = false } = params
    
    if (sendEmail) {
      await this.sendMail(message, 'ERROR')
    }
    
    this.logger.error(message, { 
      context, 
      stack: stack || new Error().stack 
    })
  }

  async warn(params: {
    message: any
    context?: string
    sendEmail?: boolean
  }): Promise<void> {
    const { message, context = this.context, sendEmail = false } = params
    
    if (sendEmail) {
      await this.sendMail(message, 'WARN')
    }
    
    this.logger.warn(message, { context })
  }

  async debug(params: {
    message: any
    context?: string
    sendEmail?: boolean
  }): Promise<void> {
    const { message, context = this.context, sendEmail = false } = params
    
    if (sendEmail) {
      await this.sendMail(message, 'DEBUG')
    }
    
    this.logger.debug(message, { context })
  }

  async verbose(params: {
    message: any
    context?: string
    sendEmail?: boolean
  }): Promise<void> {
    const { message, context = this.context, sendEmail = false } = params
    
    if (sendEmail) {
      await this.sendMail(message, 'VERBOSE')
    }
    
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
      data
    }
    
    this.logger.info(`AUDIT: ${operation} ${entity} ${id} by ${uid}`, { 
      auditData
    })
  }

  private async sendMail(message: any, typeLog: string): Promise<void> {
    const entorno = this.configService.get<string>('ENVIRONMENT')
    const mailinfo: SendMailDto = {
      text: String(message),
      subject: `[${entorno}][${typeLog}] ${Date()}`,
      to: this.configService.get<string>(`MAIL_${typeLog}`) || '',
      replyTo: this.configService.get<string>(`MAIL_${typeLog}`) || '',
    }
    try {
      await this.mailerservice.sendMail(mailinfo)
    } catch (error) {
      this.logger.error('Failed to send email notification', { 
        context: 'WinstonLoggerService',
        error: error instanceof Error ? error.message : String(error),
        originalMessage: message
      })
    }
  }
}
