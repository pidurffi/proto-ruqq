import { Injectable } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'

import { SendMailDto } from '../dto/sendmail.dto'

@Injectable()
export class EpmailerService {
  constructor(private readonly mailerService: MailerService) {}

  enviar(mailinfo: SendMailDto) {
    const { sendTo, message, subject } = mailinfo
    this.mailerService
      .sendMail({
        to: sendTo, // list of receivers
        subject: subject, // Subject line
        text: message, // plaintext body
        html: message, // HTML body content
      })
      .then(() => {
        console.log('Mail Enviado Correctamente')
      })
      .catch(error => {
        console.log(error)
        console.log('Hubo Error al enviar email ')
      })
  }
}
