import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
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

import { WinstonLoggerService } from './winston-logger.service'
import { DberrorsDto, EpGenericErrorDto, PaginationDto, RequestPaginationDto } from '../dto/'
import { EntityBase } from '../entities/base.entity'
import { EpExceptionError } from '../dto/epErrors.dto'

@Injectable()
export abstract class BaseEntityService<T extends EntityBase> {
  protected abstract getRepository(): Repository<T>

  constructor(protected readonly logger: WinstonLoggerService) {}

  protected async handleErrors(
    error: EpGenericErrorDto | EpExceptionError | unknown,
    context = 'Errors',
    sendEmail = false,
    errorsToCheck: string[] = [],
  ) {
    if (error && error.hasOwnProperty('status')) {
      const e = error as EpExceptionError
      await this.logger.error({
        message: `${e.response.message} [${e.status}]`,
        sendEmail,
        stack: BadRequestException.name,
        context,
      })
      throw new BadRequestException(e.response.message)
    } else {
      const dbError = error as EpGenericErrorDto
      if (dbError.code === '23505') {
        const errorMessage = `Un elemento con el nombre especificado ya existe.` // Mensaje personalizado para el error 23505
        await this.logger.error({
          message: errorMessage,
          sendEmail,
          stack: BadRequestException.name,
          context,
        })
        throw new BadRequestException(errorMessage)
      }

      const dberrors: DberrorsDto = {
        error: dbError,
        errorsToCheck,
        context,
      }
      await this.handleDBErrors(dberrors)
    }
  }

  protected async handleDBErrors(dberrors: DberrorsDto): Promise<never> {
    const { error, errorsToCheck, context } = dberrors

    if (errorsToCheck.includes(error.code)) {
      await this.logger.error({
        message: error.detail,
        sendEmail: false,
        stack: BadRequestException.name,
        context,
      })
      throw new BadRequestException(error.detail)
    }
    await this.logger.error({
      message: error,
      sendEmail: false,
      stack: BadRequestException.name,
      context,
    })
    throw new InternalServerErrorException('Please check logs')
  }

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

  // public async findAllBy(campo: string, valor: number | string) {
  //   return this.getRepository().createQueryBuilder().where(`${campo} = :valor`, { valor }).getMany()
  // }

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

  // Para validar UUID de relaciones que acepten NULL.
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

  public async create(
    payload: DeepPartial<T>,
    data?: SaveOptions & {
      reload: false
    },
  ) {
    const entity = await this.getRepository().create(payload)
    return this.getRepository().save(entity, data)
  }

  public async updateById(id: string, payload: DeepPartial<T>, data?: SaveOptions) {
    const object = await this.findByIdOrFail(id)
    const entity = Object.assign(object, payload)
    await this.getRepository().save(entity, { data })
  }
}
