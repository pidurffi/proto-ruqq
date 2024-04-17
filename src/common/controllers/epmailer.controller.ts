import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { EpmailerService } from '../services/epmailer.service'
import { SendMailDto } from '../dto/sendmail.dto'

@ApiTags('Mailer')
@Controller('mailer')
export class EpmailerController {
  constructor(private readonly mailerService: EpmailerService) {}

  @Post('send')
  create(@Body() body: SendMailDto) {
    console.log('enviando mail')
    try {
      return this.mailerService.enviar(body)
    } catch (error) {
      return false
    }
  }
}
