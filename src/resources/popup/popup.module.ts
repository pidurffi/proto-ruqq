import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { PopupController } from './controllers/popup.controller'
import { PopupRepository } from './repositories/popup.repository'
import { PopupService } from './services/popup.service'
import { PopupProviders } from './providers/popup.providers'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  providers: [...PopupProviders, PopupRepository, PopupService, PopupRepository],
  controllers: [PopupController],
  exports: [PopupService],
})
export class PopupModule {}
