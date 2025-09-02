import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { PriceRulesController } from './controllers/price-rules.controller'
import { PriceRulesRepository } from './repositories/price-rules.repository'
import { PriceRulesService } from './services/price-rules.service'
import { PriceRulesProviders } from './providers/price-rules.providers'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  providers: [...PriceRulesProviders, PriceRulesRepository, PriceRulesService, PriceRulesRepository],
  controllers: [PriceRulesController],
  exports: [PriceRulesService],
})
export class PriceRulesModule {}
