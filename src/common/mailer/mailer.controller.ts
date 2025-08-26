import { 
  Body, 
  Controller, 
  Post, 
  Get, 
  HttpStatus, 
  HttpException,
  UseGuards,
  Logger,
  ValidationPipe,
  UsePipes
} from '@nestjs/common'
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody,
  ApiBearerAuth 
} from '@nestjs/swagger'
import { Throttle, ThrottlerGuard } from '@nestjs/throttler'

import { MailerService, EmailResult, EmailMetrics } from './mailer.service'
import { SendMailDto } from './sendmail.dto'

@ApiTags('Email Service')
@Controller('mailer')
@UseGuards(ThrottlerGuard)
export class MailerController {
  private readonly logger = new Logger(MailerController.name)

  constructor(private readonly mailerService: MailerService) {}

  @Post('send')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 emails per minute
  @ApiOperation({ 
    summary: 'Send email',
    description: 'Send an email with optional templates, attachments, and advanced features'
  })
  @ApiBody({ type: SendMailDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Email sent successfully',
    schema: {
      properties: {
        success: { type: 'boolean' },
        messageId: { type: 'string' },
        retryAttempt: { type: 'number' }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid email data' 
  })
  @ApiResponse({ 
    status: HttpStatus.TOO_MANY_REQUESTS, 
    description: 'Rate limit exceeded' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Email sending failed' 
  })
  @UsePipes(new ValidationPipe({ 
    transform: true, 
    whitelist: true, 
    forbidNonWhitelisted: true 
  }))
  async sendEmail(@Body() emailData: SendMailDto): Promise<EmailResult> {
    try {
      this.logger.log(`Email send request received for: ${emailData.to}`)
      
      // Validate email content
      if (!emailData.text && !emailData.html && !emailData.template) {
        throw new HttpException(
          'Email must contain text, html, or template content',
          HttpStatus.BAD_REQUEST
        )
      }

      const result = await this.mailerService.sendMail(emailData)
      
      if (!result.success) {
        this.logger.error(`Email sending failed: ${result.error}`)
        throw new HttpException(
          result.error || 'Email sending failed',
          HttpStatus.INTERNAL_SERVER_ERROR
        )
      }

      this.logger.log(`Email sent successfully. MessageId: ${result.messageId}`)
      return result

    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error
      }
      
      this.logger.error(`Unexpected error in email controller: ${error?.message}`, error?.stack)
      throw new HttpException(
        'Internal server error while processing email',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('send-immediate')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 immediate emails per minute
  @ApiOperation({ 
    summary: 'Send email immediately',
    description: 'Send email immediately without queueing (bypasses queue system)'
  })
  @ApiBody({ type: SendMailDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Email sent immediately' 
  })
  @UsePipes(new ValidationPipe({ 
    transform: true, 
    whitelist: true, 
    forbidNonWhitelisted: true 
  }))
  async sendEmailImmediate(@Body() emailData: SendMailDto): Promise<EmailResult> {
    try {
      this.logger.log(`Immediate email send request for: ${emailData.to}`)
      
      if (!emailData.text && !emailData.html && !emailData.template) {
        throw new HttpException(
          'Email must contain text, html, or template content',
          HttpStatus.BAD_REQUEST
        )
      }

      const result = await this.mailerService.sendMail(emailData, true)
      
      if (!result.success) {
        throw new HttpException(
          result.error || 'Email sending failed',
          HttpStatus.INTERNAL_SERVER_ERROR
        )
      }

      return result

    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error
      }
      
      this.logger.error(`Error in immediate email sending: ${error?.message}`, error?.stack)
      throw new HttpException(
        'Failed to send email immediately',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('send-template')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 template emails per minute
  @ApiOperation({ 
    summary: 'Send templated email',
    description: 'Send email using a predefined template with context variables'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Template email sent successfully' 
  })
  async sendTemplateEmail(
    @Body() body: {
      to: string | string[]
      template: string
      context: Record<string, any>
      options?: Partial<SendMailDto>
    }
  ): Promise<EmailResult> {
    try {
      this.logger.log(`Template email request for template: ${body.template}`)
      
      const result = await this.mailerService.sendTemplateEmail(
        body.to,
        body.template,
        body.context,
        body.options
      )
      
      if (!result.success) {
        throw new HttpException(
          result.error || 'Template email sending failed',
          HttpStatus.INTERNAL_SERVER_ERROR
        )
      }

      return result

    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error
      }
      
      this.logger.error(`Error in template email: ${error?.message}`, error?.stack)
      throw new HttpException(
        'Failed to send template email',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get('metrics')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ 
    summary: 'Get email metrics',
    description: 'Retrieve current email sending statistics and metrics'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Email metrics retrieved successfully',
    schema: {
      properties: {
        sent: { type: 'number' },
        failed: { type: 'number' },
        retries: { type: 'number' }
      }
    }
  })
  getMetrics(): EmailMetrics {
    return this.mailerService.getMetrics()
  }

  @Post('metrics/reset')
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 resets per 5 minutes
  @ApiOperation({ 
    summary: 'Reset email metrics',
    description: 'Reset all email sending metrics counters to zero'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Metrics reset successfully' 
  })
  resetMetrics(): { message: string } {
    this.mailerService.resetMetrics()
    this.logger.log('Email metrics reset by request')
    return { message: 'Email metrics reset successfully' }
  }

  @Get('health')
  @ApiOperation({ 
    summary: 'Health check',
    description: 'Check if the email service is operational'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Email service is healthy' 
  })
  healthCheck(): { status: string; timestamp: string } {
    return {
      status: 'OK',
      timestamp: new Date().toISOString()
    }
  }

  @Post('test')
  @Throttle({ default: { limit: 2, ttl: 60000 } }) // 2 tests per minute
  @ApiOperation({ 
    summary: 'Send test email',
    description: 'Send a test email to verify SMTP configuration'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Test email sent successfully' 
  })
  async sendTestEmail(): Promise<EmailResult> {
    try {
      const testEmailData: SendMailDto = {
        to: process.env.MAILER_SEND_TO || 'test@example.com',
        subject: '🧪 Test Email - Sistema de Correo Mejorado',
        html: `
          <h2>✅ Test Email Exitoso</h2>
          <p>Este es un email de prueba del sistema de correo mejorado.</p>
          <ul>
            <li><strong>Servidor SMTP:</strong> ${process.env.MAILER_HOST}</li>
            <li><strong>Puerto:</strong> ${process.env.MAILER_PORT}</li>
            <li><strong>Seguro:</strong> ${process.env.MAILER_SECURE}</li>
            <li><strong>Usuario:</strong> ${process.env.MAILER_USER}</li>
            <li><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</li>
          </ul>
          <p>Si recibes este email, la configuración está funcionando correctamente. 🎉</p>
        `,
        text: 'Test Email - Sistema de Correo Mejorado. Si recibes este email, la configuración está funcionando correctamente.'
      }

      const result = await this.mailerService.sendMail(testEmailData, true)
      
      if (!result.success) {
        throw new HttpException(
          result.error || 'Test email sending failed',
          HttpStatus.INTERNAL_SERVER_ERROR
        )
      }

      this.logger.log(`Test email sent successfully to: ${testEmailData.to}`)
      return result

    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error
      }
      
      this.logger.error(`Error sending test email: ${error?.message}`, error?.stack)
      throw new HttpException(
        'Failed to send test email',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}
