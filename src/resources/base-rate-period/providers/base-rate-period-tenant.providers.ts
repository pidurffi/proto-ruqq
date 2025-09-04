import { DataSource } from 'typeorm'

import { BaseRatePeriod } from '../entities/base-rate-period.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'
import { createHybridRepositoryProvider } from '../../../common/factories/tenant-repository.factory'

export const BaseRatePeriodTenantProviders = [
  // Usar el hybrid provider que mantiene backward compatibility
  createHybridRepositoryProvider(
    repositories.BASE_RATE_PERIOD_REPOSITORY,
    BaseRatePeriod,
    resources.DATA_SOURCE_POSTGRES
  ),
]