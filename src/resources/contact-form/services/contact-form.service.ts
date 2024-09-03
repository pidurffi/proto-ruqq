import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { ContactForm } from '../entities/contact-form.entity'
import { baseErrors, EploggerService } from '../../../common'
import { resources } from '../../../engine/database/constants'
import { ContactFormRepository } from '../repositories/contact-form.repository'
import { ContactFormDto, ContactFormQueryDto } from '../dto/contact-form.dto'
import { EpmailerService } from '../../../common/mailer/mailer.service'
import { SendMailDto } from '../../../common/mailer/sendmail.dto'

@Injectable()
export class ContactFormService extends BaseEntityService<ContactForm> {
  private context = 'ContactFormService'
  constructor(
    @Inject(ContactFormRepository)
    private readonly repository: ContactFormRepository,
    private readonly mailerService: EpmailerService,
    protected readonly logger: EploggerService,

    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super(logger)
  }

  protected getRepository(): ContactFormRepository {
    return this.repository
  }

  async createContactForm(templateDto: ContactFormDto, uid: string) {
    // Envía el mail al complejo con la información del formulario
    let formattedCheckIn = ''
    let formattedCheckOut = ''
    if (templateDto.dateIn) {
      formattedCheckIn = `${templateDto.dateIn.getDate()}/${
        templateDto.dateIn.getMonth() + 1
      }/${templateDto.dateIn.getFullYear()}`
    }
    if (templateDto.dateOut) {
      formattedCheckOut = `${templateDto.dateOut.getDate()}/${
        templateDto.dateOut.getMonth() + 1
      }/${templateDto.dateOut.getFullYear()}`
    }
    const email: SendMailDto = {
      subject: `E-mail de ${templateDto.name}  desde el formulario de contacto de la web`,
      sendTo: 'hmolinari@gmail.com',
      replyTo: templateDto.email,
      message: `Nombre: ${templateDto.name}\nTeléfono: ${templateDto.phone}\nCorreo: ${templateDto.email}\nCheck-In: ${formattedCheckIn}\nCheck-Out: ${formattedCheckOut}\n\nMensaje:\n${templateDto.message}`,
    }

    await this.mailerService.sendMail(email)

    try {
      const template = await this.create({
        ...templateDto,
        uid,
      })
      return template
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code === '23505') {
        throw new BadRequestException(`Hubo un error subiendo un registro duplicado: ${error.detail}`)
      }
      // Delegar otros errores al manejador de errores general
      this.handleErrors(error, this.context, false, [baseErrors.DUPLICATE_ENTRY])
    }
  }

  async findAllWithFilterPaginated(payload: ContactFormQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }
}
