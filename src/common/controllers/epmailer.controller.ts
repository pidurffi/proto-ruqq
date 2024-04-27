import { Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { EpmailerService } from '../services/epmailer.service'

@ApiTags('Mailer')
@Controller('mailer')
export class EpmailerController {
  constructor(private readonly mailerService: EpmailerService) {}

  @Post('send')
  create() {
    console.log('enviando mail')
    try {
      return this.mailerService.sendMail()
    } catch (error) {
      return false
    }
  }
}
