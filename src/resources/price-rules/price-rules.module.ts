import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { PriceRulesController } from './controllers/price-rules.controller'
import { PriceRulesRepository } from './repositories/price-rules.repository'
import { PriceRulesService } from './services/price-rules.service'
import { PriceRulesProviders } from './providers/price-rules.providers'
import { PriceRulesTenantProviders } from './providers/price-rules-tenant.providers'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  // Usar providers tenant-aware en lugar de los tradicionales
  providers: [...PriceRulesTenantProviders, PriceRulesRepository, PriceRulesService],
  controllers: [PriceRulesController],
  exports: [PriceRulesService, PriceRulesRepository],
})
export class PriceRulesModule {}
