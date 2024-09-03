import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { MetatagsController } from './controllers/metatags.controller'
import { MetatagsRepository } from './repositories/metatags.repository'
import { MetatagsService } from './services/metatags.service'
import { MetatagsProviders } from './providers/metatags.providers'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  providers: [...MetatagsProviders, MetatagsRepository, MetatagsService, MetatagsRepository],
  controllers: [MetatagsController],
  exports: [MetatagsService],
})
export class MetatagsModule {}
