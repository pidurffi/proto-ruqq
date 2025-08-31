import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { QuotesModule } from '../quotes/quotes.module'
import { QuoteTemplateModule } from '../quote-template/quote-template.module'
import { QuoteTemplateBlockModule } from '../quote-template-block/quote-template-block.module'
import { ContentBlockModule } from '../content-block/content-block.module'
import { QuoteGeneratorController } from './controllers/quote-generator.controller'
import { QuoteGeneratorService } from './services/quote-generator.service'

@Module({
  imports: [
    ConfigModule, 
    DatabaseModule, 
    CommonModule, 
    AuthModule,
    QuotesModule,
    QuoteTemplateModule,
    QuoteTemplateBlockModule,
    ContentBlockModule
  ],
  providers: [QuoteGeneratorService],
  controllers: [QuoteGeneratorController],
  exports: [QuoteGeneratorService],
})
export class QuoteGeneratorModule {}
