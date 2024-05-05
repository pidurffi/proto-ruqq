// mailer.config.ts
import * as dotenv from 'dotenv'
import { TransportOptions } from 'nodemailer'

dotenv.config()

interface SMTPTransportOptions extends TransportOptions {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  debug: boolean
  logger: boolean
  from: string
}

console.log(process.env.MAILER_HOST)

const mailerconfig: SMTPTransportOptions = {
  host: process.env.MAILER_HOST || 'localhost',
  port: parseInt(process.env.MAILER_PORT || '25', 10),
  secure: process.env.MAILER_SECURE === 'true',
  auth: {
    user: process.env.MAILER_USER || '',
    pass: process.env.MAILER_PASS || '',
  },
  from: process.env.MAILER_USER || '', // Agrega esta línea

  debug: true, // Habilitar debug
  logger: true, // Activar logging
}

export default mailerconfig
