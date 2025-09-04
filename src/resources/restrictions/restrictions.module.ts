import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { RestrictionsController } from './controllers/restrictions.controller'
import { RestrictionsRepository } from './repositories/restrictions.repository'
import { RestrictionsService } from './services/restrictions.service'
import { RestrictionsTenantProviders } from './providers/restrictions-tenant.providers'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  providers: [...RestrictionsTenantProviders, RestrictionsRepository, RestrictionsService],
  controllers: [RestrictionsController],
  exports: [RestrictionsService, RestrictionsRepository],
})
export class RestrictionsModule {}
