import { BadRequestException, Inject, Injectable } from '@nestjs/common'
//import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Room } from '../entities/room.entity'
import { repositories } from '../constants'
import { RoomQueryDto } from '../dto/room.dto'
import { PaginationDto } from '../../../common'

@Injectable()
export class RoomRepository extends Repository<Room> {
  constructor(@Inject(repositories.ROOM_REPOSITORY) private readonly _: Repository<Room>) {
    super(_.target, _.manager, _.queryRunner)
  }

  async findByFiltersPaginated(payload: RoomQueryDto) {
    const { page, pageSize, sortBy, sortOrder } = payload

    const pageNumber = page ?? 0
    const take = pageSize ?? 10
    const skip = Math.max(0, pageNumber) * take
    const query = this.createQueryBuilder('room')
      .offset(skip)
      .limit(take)

      .select('room.id')
      .addSelect('room.imgCoverPath')
      .addSelect('room.name')
      .addSelect('room.slug')
      // .addSelect('room.title')
      // .addSelect('room.subtitle')
      .addSelect('room.shortDescription')
      .addSelect('room.fullDescription')
      // .addSelect('room.description')
      .addSelect('room.area')
      .addSelect('room.qtyPax')
      .addSelect('room.qtyBath')

    if (sortBy && sortOrder) {
      let sortByColumn = sortBy
      const column = this.metadata?.columns?.find(column => column.propertyName === sortByColumn)
      if (!column) sortByColumn = 'id'
      const order = sortOrder.toString() as 'ASC' | 'DESC'
      query.orderBy(`room.${sortBy}`, order)
    }
    const data = await query.take(take).skip(skip).getMany()
    const total = await query.getCount()

    return new PaginationDto({
      data,
      page,
      pageSize: take,
      lastPage: total ? Math.ceil(total / take) - 1 : 0,
      total,
    })
  }

  private createBaseQuery() {
    return this.createQueryBuilder('room')
      .leftJoin('room.roomImgs', 'roomImg')
      .leftJoin('room.roomEquipments', 'roomEquipment')
      .leftJoin('roomEquipment.equipment', 'equipment')
      .select('room.id')
      .addSelect('room.name')
      .addSelect('room.slug')
      .addSelect('room.shortDescription')
      .addSelect('room.fullDescription')
      .addSelect('room.imgCoverPath')
      .addSelect('room.imgCoverThumbPath')
      .addSelect('room.area')
      .addSelect('room.qtyPax')
      .addSelect('room.qtyBath')
      .addSelect('room.qtyRooms')
      .addSelect('room.isOpen')
      .addSelect('roomImg.id')
      .addSelect('roomImg.imgPath')
      .addSelect('roomImg.imgThumbPath')
      .addSelect('roomEquipment.id')
      .addSelect('equipment.slug')
      .addSelect('equipment.name')
      .where('room.isOpen = true')
  }

  async getAllRooms(): Promise<Room[]> {
    return this.createBaseQuery().getMany()
  }

  async getRoomById(id: string): Promise<Room> {
    const room = await this.createBaseQuery().andWhere('room.id = :id', { id }).getOne()

    if (!room) {
      throw new BadRequestException(Room, id)
    }

    return room
  }
}
