// epmailer.service.ts
import { Injectable } from '@nestjs/common'
import * as nodemailer from 'nodemailer'

import mailerconfig from '../../config/mailer.config'

@Injectable()
export class EpmailerService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport(mailerconfig)
  }

  async sendMail() {
    try {
      const result = await this.transporter.sendMail({
        from: 'hi@ignatix.com',
        to: 'hmolinari@gmail.com',
        subject: 'IGNATIX',
        text: '*** * Cuerpo del mail',
      })
      console.log('Mail sent:', result)
    } catch (error) {
      console.error('Error sending mail:', error)
    }
  }
}
