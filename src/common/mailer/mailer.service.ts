import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MailerService as NestMailerService, ISendMailOptions } from '@nestjs-modules/mailer'

import { SendMailDto, EmailPriority } from './sendmail.dto'
import { ExtendedMailerOptions } from '../../config/mailer.config'

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  retryAttempt?: number
}

export interface EmailMetrics {
  sent: number
  failed: number
  retries: number
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name)
  private metrics: EmailMetrics = { sent: 0, failed: 0, retries: 0 }

  constructor(
    private readonly nestMailerService: NestMailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendMail(mailData: SendMailDto, immediate = false): Promise<EmailResult> {
    try {
      // Verificar si el envío de emails está deshabilitado
      const disableEmails = this.configService.get<string>('DISABLE_EMAIL_SENDING') === 'true'
      
      if (disableEmails) {
        this.logger.log(`📧 Email sending disabled - would send to: ${mailData.to}`)
        return {
          success: true,
          messageId: 'disabled-' + Date.now(),
          retryAttempt: 0
        }
      }

      this.logger.log(`Sending email to: ${mailData.to}`)
      return this.sendEmailDirectly(mailData)
    } catch (error: any) {
      this.logger.error('Failed to process email', error?.stack)
      this.metrics.failed++
      return {
        success: false,
        error: error?.message || 'Unknown error occurred'
      }
    }
  }

  async sendEmailDirectly(mailData: SendMailDto, retryAttempt = 0): Promise<EmailResult> {
    try {
      const mailOptions = this.buildMailOptions(mailData)
      
      const result = await this.nestMailerService.sendMail(mailOptions)
      
      this.logger.log(`Email sent successfully. MessageId: ${result.messageId}`)
      this.metrics.sent++
      
      return {
        success: true,
        messageId: result.messageId,
        retryAttempt
      }
    } catch (error: any) {
      this.logger.error(`Email sending failed (attempt ${retryAttempt + 1}): ${error?.message}`, error?.stack)
      
      const mailerConfig = this.configService.get<ExtendedMailerOptions>('mailer')
      const maxRetries = mailerConfig?.retries || 3
      
      if (retryAttempt < maxRetries) {
        this.metrics.retries++
        const delay = (mailerConfig?.retryDelay || 5000) * Math.pow(2, retryAttempt)
        
        this.logger.log(`Retrying email in ${delay}ms (attempt ${retryAttempt + 1}/${maxRetries})`)
        
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(this.sendEmailDirectly(mailData, retryAttempt + 1))
          }, delay)
        })
      }

      this.metrics.failed++
      return {
        success: false,
        error: this.sanitizeError(error),
        retryAttempt
      }
    }
  }


  async sendTemplateEmail(
    to: string | string[],
    template: string,
    context: Record<string, any>,
    options: Partial<SendMailDto> = {}
  ): Promise<EmailResult> {
    const mailData: SendMailDto = {
      to: Array.isArray(to) ? to.join(',') : to,
      template,
      context,
      subject: options.subject || 'Notification',
      ...options
    }

    return this.sendMail(mailData)
  }

  getMetrics(): EmailMetrics {
    return { ...this.metrics }
  }

  resetMetrics(): void {
    this.metrics = { sent: 0, failed: 0, retries: 0 }
    this.logger.log('Email metrics reset')
  }

  private buildMailOptions(mailData: SendMailDto): ISendMailOptions {
    const options: ISendMailOptions = {
      to: mailData.to,
      subject: mailData.subject,
    }

    if (mailData.replyTo) options.replyTo = mailData.replyTo
    if (mailData.cc?.length) options.cc = mailData.cc
    if (mailData.bcc?.length) options.bcc = mailData.bcc
    if (mailData.text) options.text = mailData.text
    if (mailData.html) options.html = mailData.html
    if (mailData.template) {
      options.template = mailData.template
      options.context = mailData.context || {}
    }
    if (mailData.attachments?.length) {
      options.attachments = mailData.attachments.map(attachment => ({
        filename: attachment.filename,
        path: attachment.path,
        contentType: attachment.contentType
      }))
    }

    // Set priority headers
    if (mailData.priority) {
      options.priority = mailData.priority === EmailPriority.HIGH ? 'high' : 
                        mailData.priority === EmailPriority.LOW ? 'low' : 'normal'
    }

    return options
  }


  private sanitizeError(error: any): string {
    // Remove sensitive information from error messages
    const message = error.message || 'Unknown error'
    return message.replace(/(password|auth|token|key)=[\w\-._]+/gi, '$1=***')
  }
}