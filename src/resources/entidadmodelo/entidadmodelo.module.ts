import { ConfigModule } from '@nestjs/config'
import { Module } from '@nestjs/common'

import { AuthModule } from '../../engine/auth'
import { CommonModule } from '../../common/common.module'
import { DatabaseModule } from '../../engine/database/database.module'
import { EntidadmodeloController } from './controllers/entidadmodelo.controller'
import { EntidadmodeloProviders } from './providers/entidadmodelo.providers'
import { EntidadmodeloService } from './services'
import { EntidadmodeloRepository } from './repositories/entidadmodelo.repository'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  controllers: [EntidadmodeloController],
  providers: [...EntidadmodeloProviders, EntidadmodeloService, EntidadmodeloRepository],
  exports: [EntidadmodeloService],
})
export class EntidadmodeloModule {}
