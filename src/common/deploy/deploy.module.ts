// deploy.module.ts
import { Module } from '@nestjs/common'

import { DeployController } from './deploy.controller'
import { AuthModule } from '../../engine/auth/auth.module' // Asegúrate de que la ruta sea correcta

@Module({
  imports: [AuthModule],
  controllers: [DeployController],
})
export class DeployModule {}
