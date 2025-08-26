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
  const isDevelopment = process.env.ENVIRONMENT === 'local' || process.env.NODE_ENV === 'development'
  
  // Only validate required variables in production
  if (isProduction) {
    const requiredVars = ['MAILER_HOST', 'MAILER_USER', 'MAILER_PASS']
    const missingVars = requiredVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
    }
  }

  // Provide default values for development  
  const mailerHost = process.env.MAILER_HOST || 'localhost'
  const mailerUser = process.env.MAILER_USER || 'test@example.com' 
  const mailerPass = process.env.MAILER_PASS || 'test-password'

  if (!mailerHost || !mailerUser || !mailerPass) {
    console.warn('⚠️  Mailer configuration incomplete. Email functionality may not work properly.')
    console.warn('Debug - mailerHost:', mailerHost)
    console.warn('Debug - mailerUser:', mailerUser)
    console.warn('Debug - mailerPass:', mailerPass ? '***' : 'undefined')
  }

  return {
    transport: {
      host: mailerHost,
      port: parseInt(process.env.MAILER_PORT || '587', 10),
      secure: process.env.MAILER_SECURE === 'true',
      auth: {
        user: mailerUser,
        pass: mailerPass,
      },
      debug: !isProduction,
      logger: !isProduction,
      pool: process.env.MAILER_POOL === 'true' || undefined,
      maxConnections: parseInt(process.env.MAILER_MAX_CONNECTIONS || '5', 10),
      maxMessages: parseInt(process.env.MAILER_MAX_MESSAGES || '100', 10),
    },
    defaults: {
      from: process.env.MAILER_FROM || mailerUser,
    },
    template: {
      dir: path.join(process.cwd(), 'src/common/mailer/templates'),
      adapter: new HandlebarsAdapter(),
      options: {
        strict: true,
      },
    },
    retries: parseInt(process.env.MAILER_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.MAILER_RETRY_DELAY || '5000', 10),
  }
})
