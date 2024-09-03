import { Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import slugify from 'slugify'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { Equipment } from '../entities/equipment.entity'
import { EploggerService } from '../../../common'
import { resources } from '../../../engine/database/constants'
import { EquipmentRepository } from '../repositories/equipment.repository'
import { EquipmentDto, EquipmentQueryDto } from '../dto/equipment.dto'

@Injectable()
export class EquipmentService extends BaseEntityService<Equipment> {
  constructor(
    @Inject(EquipmentRepository)
    private readonly repository: EquipmentRepository,

    protected readonly logger: EploggerService,

    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super(logger)
  }

  protected getRepository(): EquipmentRepository {
    return this.repository
  }

  async findAllWithFilterPaginated(payload: EquipmentQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }

  async getAllEquipments() {
    return this.getRepository().find()
  }

  async createEquipment(equipmentDto: EquipmentDto, uid: string) {
    let { slug } = equipmentDto
    slug = slug || slugify(equipmentDto.name, { lower: true })
    const equipment = await this.create({
      ...equipmentDto,
      slug,
      uid,
    })
    return equipment
  }
}
