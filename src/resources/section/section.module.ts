import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { SectionController } from './controllers/section.controller'
import { SectionRepository } from './repositories/section.repository'
import { SectionService } from './services/section.service'
import { SectionProviders } from './providers/section.providers'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  providers: [...SectionProviders, SectionRepository, SectionService, SectionRepository],
  controllers: [SectionController],
  exports: [SectionService],
})
export class SectionModule {}
