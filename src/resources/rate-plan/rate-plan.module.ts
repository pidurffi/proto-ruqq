import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { RatePlanController } from './controllers/rate-plan.controller'
import { RatePlanRepository } from './repositories/rate-plan.repository'
import { RatePlanService } from './services/rate-plan.service'
import { RatePlanTenantProviders } from './providers/rate-plan-tenant.providers'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  providers: [...RatePlanTenantProviders, RatePlanRepository, RatePlanService],
  controllers: [RatePlanController],
  exports: [RatePlanService, RatePlanRepository],
})
export class RatePlanModule {}
