import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { QuoteTemplateController } from './controllers/quote-template.controller'
import { QuoteTemplateRepository } from './repositories/quote-template.repository'
import { QuoteTemplateService } from './services/quote-template.service'
import { QuoteTemplateProviders } from './providers/quote-template.providers'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  providers: [...QuoteTemplateProviders, QuoteTemplateRepository, QuoteTemplateService, QuoteTemplateRepository],
  controllers: [QuoteTemplateController],
  exports: [QuoteTemplateService],
})
export class QuoteTemplateModule {}
