import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { QuoteTemplateController } from './controllers/quote-template.controller'
import { QuoteTemplateRepository } from './repositories/quote-template.repository'
import { QuoteTemplateService } from './services/quote-template.service'
import { QuoteTemplateTenantProviders } from './providers/quote-template-tenant.providers'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  providers: [...QuoteTemplateTenantProviders, QuoteTemplateRepository, QuoteTemplateService],
  controllers: [QuoteTemplateController],
  exports: [QuoteTemplateService, QuoteTemplateRepository],
})
export class QuoteTemplateModule {}
