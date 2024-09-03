import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { BannerController } from './controllers/banner.controller'
import { BannerRepository } from './repositories/banner.repository'
import { BannerService } from './services/banner.service'
import { BannerProviders } from './providers/banner.providers'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  providers: [...BannerProviders, BannerRepository, BannerService, BannerRepository],
  controllers: [BannerController],
  exports: [BannerService],
})
export class BannerModule {}
