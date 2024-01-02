import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../database/database.module'
import { CommonModule } from '../../../common/common.module'
import { AuthModule } from '../../auth/auth.module'
import { TemplateController } from './controllers/template'
import { TemplateRepository } from './repositories/template'
import { TemplateService } from './services/template'
import { TemplateProviders } from './providers/template'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  providers: [...TemplateProviders, TemplateRepository, TemplateService, TemplateRepository],
  controllers: [TemplateController],
  exports: [TemplateService],
})
export class TemplateModule {}
