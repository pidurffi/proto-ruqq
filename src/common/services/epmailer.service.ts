import { Injectable } from '@nestjs/common'
import * as nodemailer from 'nodemailer'

import { SendMailDto } from '../dto/sendmail.dto'
import { mailerconfig } from '../../config/mailerconfig'

@Injectable()
export class EpmailerService {
  private transporter
  constructor() {
    this.transporter = nodemailer.createTransport(mailerconfig)
  }

  async enviar(mailinfo: SendMailDto) {
    const { sendto, message, subject } = mailinfo

    const mensaje = {
      from: mailerconfig.from,
      to: sendto,
      subject,
      text: message,
    }

    try {
      await this.transporter.sendMail(mensaje)
      console.log('Correo enviado correctamente')
    } catch (error) {
      console.error('Error al enviar el correo:', error)
    }
  }
}
