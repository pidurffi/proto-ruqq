import { DataSource } from 'typeorm'

import { ContactForm } from '../entities/contact-form.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const ContactFormProviders = [
  {
    provide: repositories.CONTACTFORM_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(ContactForm),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
