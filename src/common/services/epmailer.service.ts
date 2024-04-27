// Este no tira errores de typescript:

import * as nodemailer from 'nodemailer'
import { Injectable } from '@nestjs/common'

@Injectable()
export class EpmailerService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'sandbox.smtp.mailtrap.io',
      port: 2525,
      secure: process.env.MAILER_SECURE === 'true',
      auth: {
        user: '8a961435639e76',
        pass: '5165315233102b',
      },
    })
  }

  async sendMail() {
    await this.transporter.sendMail({
      to: 'hmolinari@gmail.com',
      subject: 'Welcome user! Confirm your Email',
      text: 'Cuerpo del mail',
    })
  }
}
