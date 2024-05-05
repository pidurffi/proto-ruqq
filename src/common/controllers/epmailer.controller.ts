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
    try {
      return this.mailerService.sendMail(body)
    } catch (error) {
      return false
    }
  }
}
