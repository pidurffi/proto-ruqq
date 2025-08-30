import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { ContentBlockController } from './controllers/content-block.controller'
import { ContentBlockRepository } from './repositories/content-block.repository'
import { ContentBlockService } from './services/content-block.service'
import { ContentBlockProviders } from './providers/content-block.providers'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  providers: [...ContentBlockProviders, ContentBlockRepository, ContentBlockService, ContentBlockRepository],
  controllers: [ContentBlockController],
  exports: [ContentBlockService],
})
export class ContentBlockModule {}
