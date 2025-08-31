import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { QuoteTemplateBlockController } from './controllers/quote-template-block.controller'
import { QuoteTemplateBlockRepository } from './repositories/quote-template-block.repository'
import { QuoteTemplateBlockService } from './services/quote-template-block.service'
import { QuoteTemplateBlockProviders } from './providers/quote-template-block.providers'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  providers: [
    ...QuoteTemplateBlockProviders,
    QuoteTemplateBlockRepository,
    QuoteTemplateBlockService,
  ],
  controllers: [QuoteTemplateBlockController],
  exports: [QuoteTemplateBlockService, QuoteTemplateBlockRepository],
})
export class QuoteTemplateBlockModule {}
