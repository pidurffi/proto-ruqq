import * as dotenv from 'dotenv'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import { MailerOptions } from '@nestjs-modules/mailer'

dotenv.config()
console.log(__dirname + '/../' + process.env.MAILER_TEMPLATES_FOLDER)

export const mailerconfig = {
  transport: process.env.MAILER_TRANSPORT,
  defaults: {
    from: process.env.MAILER_FROM,
  },
  template: {
    dir: __dirname + '/' + process.env.MAILER_TEMPLATES_FOLDER,
    adapter: new HandlebarsAdapter(),
    options: {
      strict: true,
    },
  },
} as MailerOptions
