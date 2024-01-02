import { ConfigModule } from '@nestjs/config'
import { Module } from '@nestjs/common'

import { AuthModule } from '../../engine/auth'
import { CommonModule } from '../../common/common.module'
import { DatabaseModule } from '../../engine/database/database.module'
import { EntidadRelacionController } from './controllers/entidad-relacion.controller'
import { EntidadmodeloModule } from '../entidadmodelo/entidadmodelo.module'
import { EntidadRelacionProviders } from './providers/entidad-relacion.providers'
import { EntidadRelacionService } from './services'
import { EntidadRelacionRepository } from './repositories/entidad-relacion.repository'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule, EntidadmodeloModule],
  controllers: [EntidadRelacionController],
  providers: [...EntidadRelacionProviders, EntidadRelacionService, EntidadRelacionRepository],
  exports: [EntidadRelacionService],
})
export class EntidadRelacionModule {}
