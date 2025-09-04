import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { BaseRatePeriodController } from './controllers/base-rate-period.controller'
import { BaseRatePeriodRepository } from './repositories/base-rate-period.repository'
import { BaseRatePeriodService } from './services/base-rate-period.service'
import { BaseRatePeriodProviders } from './providers/base-rate-period.providers'
import { BaseRatePeriodTenantProviders } from './providers/base-rate-period-tenant.providers'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  providers: [...BaseRatePeriodProviders, BaseRatePeriodRepository, BaseRatePeriodService],
  controllers: [BaseRatePeriodController],
  exports: [BaseRatePeriodService, BaseRatePeriodRepository],
})
export class BaseRatePeriodModule {}
