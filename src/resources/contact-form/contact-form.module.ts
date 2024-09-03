import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { ContactFormController } from './controllers/contact-form.controller'
import { ContactFormRepository } from './repositories/contact-form.repository'
import { ContactFormService } from './services/contact-form.service'
import { ContactFormProviders } from './providers/contact-form.providers'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  providers: [...ContactFormProviders, ContactFormRepository, ContactFormService, ContactFormRepository],
  controllers: [ContactFormController],
  exports: [ContactFormService],
})
export class ContactFormModule {}
