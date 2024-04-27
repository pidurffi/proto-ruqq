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
}

const mailerconfig: SMTPTransportOptions = {
  host: process.env.MAILER_HOST || 'localhost',
  port: parseInt(process.env.MAILER_PORT || '25', 10),
  secure: process.env.MAILER_SECURE === 'true',
  auth: {
    user: process.env.MAILER_USER || '',
    pass: process.env.MAILER_PASS || '',
  },
}

export default mailerconfig
