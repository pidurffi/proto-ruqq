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
    await this.transporter.sendMail({
      to: 'hmolinari@gmail.com',
      subject: 'Welcome user! Confirm your Email',
      text: 'Cuerpo del mail',
    })
  }
}
