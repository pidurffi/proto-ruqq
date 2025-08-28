import { Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { RoomType } from '../entities/room-type.entity'
import { resources } from '../../../engine/database/constants'
import { RoomTypeRepository } from '../repositories/room-type.repository'
import { RoomTypeQueryDto, RoomTypeCreateDto } from '../dto'

@Injectable()
export class RoomTypeService extends BaseEntityService<RoomType> {
  constructor(
    @Inject(RoomTypeRepository)
    private readonly repository: RoomTypeRepository,
    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super()
  }

  protected getRepository(): RoomTypeRepository {
    return this.repository
  }

  async createRoomType(
    createRoomTypeDto: RoomTypeCreateDto,
    uid: string,
  ): Promise<RoomType> {
    return await this.create({ ...createRoomTypeDto, uid })
  }

  async findAllWithFilterPaginated(payload: RoomTypeQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }

  /* 
  ejemplo
  async prueba() {
    return this.getRepository().consultaPrueba()
  } */
}
