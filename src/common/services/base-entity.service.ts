import { Injectable, NotFoundException } from '@nestjs/common'
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  In,
  Repository,
  SaveOptions,
} from 'typeorm'
import { isUUID } from 'class-validator'

import { PaginationDto, RequestPaginationDto } from '../dto/'
import { EntityBase } from '../entities/base.entity'

@Injectable()
export abstract class BaseEntityService<T extends EntityBase> {
  protected abstract getRepository(): Repository<T>

  public async findAll(t?: FindManyOptions<T>) {
    return this.getRepository().find(t)
  }

  public async findAllPaginated(payload?: RequestPaginationDto, t: FindManyOptions<T> = {}): Promise<PaginationDto<T>> {
    const page = payload?.page ? payload.page : 0
    const pageSize = payload?.pageSize
    const take = pageSize ?? 10
    const skip = Math.max(0, page - 1) * take
    let sortBy = payload?.sortBy ?? 'id'
    const column = this.getRepository().metadata?.columns?.find(column => column.propertyName === sortBy)
    if (!column) sortBy = 'id'

    const sortOrder = payload?.sortOrder ?? 'DESC'

    const [data, total]: [T[], number] = await this.getRepository().findAndCount({
      ...t,
      skip,
      take,
      order: { [sortBy]: sortOrder } as FindOptionsOrder<T>,
    })
    return new PaginationDto({
      data,
      page,
      pageSize: take,
      lastPage: Math.ceil(total / take),
      total,
    })
  }

  public async findById(id: string) {
    return this.getRepository().createQueryBuilder().where('id = :id', { id }).getOne()
  }

  public async findByIdOrFail(id: string) {
    const object = await this.getRepository().createQueryBuilder().where('id = :id', { id }).getOne()
    if (!object) throw new NotFoundException(`Object with id ${id} not found`)
    return object
  }

  public async findAllBy(conditions: { campo: string; valor: number | string }[]) {
    let query = this.getRepository().createQueryBuilder()

    conditions.forEach((condition, index) => {
      if (index === 0) {
        query = query.where(`${condition.campo} = :valor${index}`, { [`valor${index}`]: condition.valor })
      } else {
        query = query.andWhere(`${condition.campo} = :valor${index}`, { [`valor${index}`]: condition.valor })
      }
    })

    return query.getMany()
  }

  public async findByIdOrFailAllowsNull(id: string | null) {
    let object = null
    if (isUUID(id)) {
      object = await this.getRepository().createQueryBuilder().where('id = :id', { id }).getOne()
      if (!object) throw new NotFoundException(`Object with id ${id} not found`)
    }
    return object
  }

  public async findByIds(ids: string[]) {
    return this.getRepository().findBy({
      id: In(ids),
    } as FindOptionsWhere<T>)
  }

  public async findOneByFilter(t: FindOneOptions<T>) {
    return this.getRepository().findOne(t)
  }

  public async delete(id: string) {
    return this.getRepository().softDelete(id)
  }

  public async deleteOrFail(id: string) {
    await this.findByIdOrFail(id)
    return this.getRepository().softDelete(id)
  }

  public async deleteHard(id: string) {
    return this.getRepository().delete(id)
  }

  public async create(payload: DeepPartial<T>, data?: SaveOptions) {
    const entity = await this.getRepository().create(payload)
    return this.getRepository().save(entity, data)
  }

  public async updateById(id: string, payload: DeepPartial<T>, data?: SaveOptions) {
    const object = await this.findByIdOrFail(id)
    const entity = Object.assign(object, payload)
    await this.getRepository().save(entity, { data })
  }
}