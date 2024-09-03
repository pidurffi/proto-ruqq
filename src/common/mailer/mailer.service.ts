// epmailer.service.ts
import { Injectable } from '@nestjs/common'
import * as nodemailer from 'nodemailer'

import mailerconfig from '../../config/mailer.config'
import { SendMailDto } from './sendmail.dto'

@Injectable()
export class EpmailerService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport(mailerconfig)
  }

  async sendMail(mailinfo: SendMailDto): Promise<{ status: string; message: string }> {
    const { sendTo, replyTo, message, subject } = mailinfo

    try {
      await this.transporter.sendMail({
        from: mailerconfig.from,
        replyTo: replyTo,
        to: sendTo,
        subject: subject,
        text: message,
      })

      return { status: 'success', message: 'Mail sent successfully' }
    } catch (error) {
      throw new Error('Mail sending failed')
    }
  }
}
