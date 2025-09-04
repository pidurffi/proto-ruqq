import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from '../../engine/database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthModule } from '../../engine/auth/auth.module'
import { OccupancyRateModifiersController } from './controllers/occupancy-rate-modifiers.controller'
import { OccupancyRateModifiersRepository } from './repositories/occupancy-rate-modifiers.repository'
import { OccupancyRateModifiersService } from './services/occupancy-rate-modifiers.service'
import { OccupancyRateModifiersProviders } from './providers/occupancy-rate-modifiers.providers'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  providers: [...OccupancyRateModifiersProviders, OccupancyRateModifiersRepository, OccupancyRateModifiersService],
  controllers: [OccupancyRateModifiersController],
  exports: [OccupancyRateModifiersService, OccupancyRateModifiersRepository],
})
export class OccupancyRateModifiersModule {}
