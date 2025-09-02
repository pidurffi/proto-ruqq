import { Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { PriceRule } from '../entities/price-rules.entity'
import { resources } from '../../../engine/database/constants'
import { PriceRulesRepository } from '../repositories/price-rules.repository'
import { PriceRulesQueryDto, CreatePriceRuleDto, BulkCreatePriceRuleDto, UpdatePriceRuleDto } from '../dto'
import { AdjustmentType } from '../../../common/enums/adjustment-type.enum'

@Injectable()
export class PriceRulesService extends BaseEntityService<PriceRule> {
  constructor(
    @Inject(PriceRulesRepository)
    private readonly repository: PriceRulesRepository,
    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super()
  }

  protected getRepository(): PriceRulesRepository {
    return this.repository
  }

  async createPriceRule(
    createPriceRuleDto: CreatePriceRuleDto,
    uid: string,
  ): Promise<PriceRule> {
    const priority = createPriceRuleDto.priority ?? 0
    return await this.create({ 
      ...createPriceRuleDto, 
      priority,
      uid 
    })
  }

  async createBulkPriceRules(
    bulkDto: BulkCreatePriceRuleDto,
    uid: string,
  ): Promise<PriceRule[]> {
    const { roomTypeIds, ...ruleData } = bulkDto
    
    const rules: Partial<PriceRule>[] = roomTypeIds.map(roomTypeId => ({
      ...ruleData,
      roomTypeId,
      priority: 0,
      uid
    }))

    return await this.repository.save(rules)
  }

  /**
   * Lógica de decisión para bulk edit: 
   * - Si daysOfWeek.length === 7: Modificar base_rate_period
   * - Si daysOfWeek.length < 7: Crear price_rules
   */
  async applyBulkPriceEdit(bulkDto: BulkCreatePriceRuleDto, uid: string) {
    if (bulkDto.daysOfWeek.length === 7) {
      // TODO: Integrar con BaseRatePeriodService para modificar tarifa base
      throw new Error('Bulk edit para todos los días (modificar base_rate_period) no implementado aún')
    } else {
      // Crear reglas de precio para días específicos
      return await this.createBulkPriceRules(bulkDto, uid)
    }
  }

  async findAllWithFilterPaginated(payload: PriceRulesQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }

  /**
   * Busca la regla aplicable para una fecha y room type específicos
   */
  async findApplicableRule(roomTypeId: string, date: Date): Promise<PriceRule | null> {
    return await this.repository.findApplicableRule(roomTypeId, date)
  }

  /**
   * Calcula el precio ajustado aplicando la regla de precio
   */
  calculateAdjustedPrice(basePrice: number, rule: PriceRule): number {
    switch (rule.adjustmentType) {
      case AdjustmentType.FIXED_PRICE:
        return rule.adjustmentValue
      case AdjustmentType.FIXED_AMOUNT:
        return basePrice + rule.adjustmentValue
      case AdjustmentType.PERCENTAGE:
        return basePrice * (1 + rule.adjustmentValue / 100)
      default:
        return basePrice
    }
  }
}
