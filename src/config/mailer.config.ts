import { registerAs } from '@nestjs/config'
import { MailerOptions } from '@nestjs-modules/mailer'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import * as path from 'path'

export interface ExtendedMailerOptions extends MailerOptions {
  retries?: number
  retryDelay?: number
}

export default registerAs('mailer', (): ExtendedMailerOptions => {
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Always try to use real environment variables first
  const mailerHost = process.env.MAILER_HOST
  const mailerUser = process.env.MAILER_USER
  const mailerPass = process.env.MAILER_PASS

  // Only provide defaults if no environment variables are set AND it's development
  const finalHost = mailerHost || (isProduction ? undefined : 'localhost')
  const finalUser = mailerUser || (isProduction ? undefined : 'test@example.com') 
  const finalPass = mailerPass || (isProduction ? undefined : 'test-password')

  // Validate required variables in production or when no defaults are used
  if (isProduction || (mailerHost && mailerUser && mailerPass)) {
    if (!finalHost || !finalUser || !finalPass) {
      const missing = []
      if (!finalHost) missing.push('MAILER_HOST')
      if (!finalUser) missing.push('MAILER_USER')  
      if (!finalPass) missing.push('MAILER_PASS')
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
  }

  if (!finalHost || !finalUser || !finalPass) {
    console.warn('⚠️  Mailer configuration incomplete. Email functionality may not work properly.')
    console.warn('Debug - finalHost:', finalHost)
    console.warn('Debug - finalUser:', finalUser)
    console.warn('Debug - finalPass:', finalPass ? '***' : 'undefined')
  }

  return {
    transport: {
      host: finalHost,
      port: parseInt(process.env.MAILER_PORT || '587', 10),
      secure: process.env.MAILER_SECURE === 'true',
      auth: {
        user: finalUser,
        pass: finalPass,
      },
      debug: !isProduction,
      logger: !isProduction,
      pool: process.env.MAILER_POOL === 'true' || undefined,
      maxConnections: parseInt(process.env.MAILER_MAX_CONNECTIONS || '5', 10),
      maxMessages: parseInt(process.env.MAILER_MAX_MESSAGES || '100', 10),
    },
    defaults: {
      from: process.env.MAILER_FROM || finalUser,
    },
    template: {
      dir: path.join(process.cwd(), 'src/common/mailer/templates'),
      adapter: new HandlebarsAdapter(),
      options: {
        strict: false,
        helpers: {
          currentYear: () => new Date().getFullYear(),
          currentDate: () => new Date().toLocaleDateString('es-ES'),
          currentDateTime: () => new Date().toLocaleString('es-ES')
        }
      },
    },
    retries: parseInt(process.env.MAILER_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.MAILER_RETRY_DELAY || '5000', 10),
  }
})
