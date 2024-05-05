// epmailer.service.ts
import { Injectable } from '@nestjs/common'
import * as nodemailer from 'nodemailer'

import mailerconfig from '../../config/mailer.config'
import { SendMailDto } from '../dto/sendmail.dto'

@Injectable()
export class EpmailerService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport(mailerconfig)
  }

  async sendMail(mailinfo: SendMailDto) {
    const { sendTo, message, subject } = mailinfo

    try {
      const result = await this.transporter.sendMail({
        from: mailerconfig.from,
        to: sendTo,
        subject: subject,
        text: message,
      })
      // console.log('Mail sent:', result)
    } catch (error) {
      console.error('Error sending mail:', error)
    }
  }
}
