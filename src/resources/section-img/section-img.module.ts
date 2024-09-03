import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { SectionImgController } from './controllers/section-img.controller'
import { SectionImgRepository } from './repositories/section-img.repository'
import { SectionImgService } from './services/section-img.service'
import { SectionImgProviders } from './providers/section-img.providers'
import { SectionModule } from '../section/section.module'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule, SectionModule],
  providers: [...SectionImgProviders, SectionImgRepository, SectionImgService, SectionImgRepository],
  controllers: [SectionImgController],
  exports: [SectionImgService],
})
export class SectionImgModule {}
