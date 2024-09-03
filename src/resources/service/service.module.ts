import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { ServiceController } from './controllers/service.controller'
import { ServiceRepository } from './repositories/service.repository'
import { ServiceService } from './services/service.service'
import { ServiceProviders } from './providers/service.providers'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  providers: [...ServiceProviders, ServiceRepository, ServiceService, ServiceRepository],
  controllers: [ServiceController],
  exports: [ServiceService],
})
export class ServiceModule {}
