import { Body, Controller, Get, Inject, Post, Query, UseGuards } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'

import { ContactFormService } from '../services/contact-form.service'
import { ContactFormDto, ContactFormQueryDto } from '../dto/contact-form.dto'
import { ContactForm } from '../entities/contact-form.entity'
import { UserRoleGuard } from '../../../engine/auth/'
import { ValidRoles } from '../../../engine/auth/interfaces/index'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'
import { BaseController } from '../../../common/controllers/base.controller'

@Controller('/contact-form')
@ApiTags('ContactForm')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class ContactFormController extends BaseController<ContactForm> {
  constructor(@Inject(ContactFormService) private readonly service: ContactFormService) {
    super()
  }

  getService(): ContactFormService {
    return this.service
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'List ContactForm ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiForbiddenResponse({ status: 403, description: 'Forbidden.' })
  // @ApiOkResponse({ type: ContactFormPaginationDto })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async findAll(@Query() query: ContactFormQueryDto) {
    return this.getService().findAllWithFilterPaginated(query)
  }

  @Post('/')
  @ApiBody({ type: ContactFormDto, required: true })
  @ApiCreatedResponse({ type: ContactForm, description: 'ContactForm created' })
  @ApiResponse({
    status: 200,
    description: 'Post ContactForm ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  // @RoleProtected(ValidRoles.SUPER_ADMIN)
  // @UseGuards(AuthGuard(), UserRoleGuard)
  async createContactForm(@Body() contactFormDto: ContactFormDto) {
    return this.getService().createContactForm(contactFormDto, '704faa5c-5ef4-42cf-9a3e-084b998167ba')
  }
}
