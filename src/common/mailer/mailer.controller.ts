import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { MailerService } from './mailer.service'
import { SendMailDto } from './sendmail.dto'

@ApiTags('Mailer')
@Controller('mailer')
export class MailerController {
  constructor(private readonly mailerService: MailerService) {}

  @Post('send')
  async create(@Body() body: SendMailDto) {
    try {
      const result = await this.mailerService.sendMail(body)
      return result
    } catch (error) {
      return { status: 'error', message: 'Mail sending failed' }
    }
  }
}
