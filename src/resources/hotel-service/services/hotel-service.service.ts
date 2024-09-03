import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { HotelService } from '../entities/hotel-service.entity'
import { baseErrors, EploggerService } from '../../../common'
import { resources } from '../../../engine/database/constants'
import { HotelServiceRepository } from '../repositories/hotel-service.repository'
import { HotelServiceDto, HotelServiceQueryDto, UpdateHotelServiceDto } from '../dto/hotel-service.dto'
import { ServiceService } from '../../service/services/service.service'

@Injectable()
export class HotelServiceService extends BaseEntityService<HotelService> {
  private context = 'HotelServiceService'
  constructor(
    @Inject(HotelServiceRepository)
    private readonly repository: HotelServiceRepository,
    private readonly serviceService: ServiceService,

    protected readonly logger: EploggerService,

    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super(logger)
  }

  protected getRepository(): HotelServiceRepository {
    return this.repository
  }

  async createHotelService(hotelServiceDto: HotelServiceDto, uid: string) {
    const { serviceIds } = hotelServiceDto

    // 1) Verificar que todos los servicios existan
    await Promise.all(
      serviceIds.map(async serviceId => {
        await this.serviceService.findByIdOrFail(serviceId)
      }),
    )

    // 3) Eliminar todos los registros existentes para el hotel
    await this.getRepository().delete({ hotel: { id: '00000000-0000-0000-0000-000000000000' } })
    const savedHotelServices: HotelService[] = []

    for (const serviceId of serviceIds) {
      try {
        const hotelService = this.getRepository().create({
          hotel: { id: '00000000-0000-0000-0000-000000000000' },
          service: { id: serviceId },
          uid,
        })
        savedHotelServices.push(await this.getRepository().save(hotelService))
      } catch (error) {
        this.handleErrors(error, this.context, false, [baseErrors.DUPLICATE_ENTRY])
      }
    }
  }

  async updateHotelService(id: string, updateHotelServiceDto: UpdateHotelServiceDto, uid: string) {
    const template = await this.getRepository().preload({
      id,
      ...updateHotelServiceDto,
    })
    if (!template) {
      throw new BadRequestException('No se encontró el registro a actualizar')
    }
    //Create query runner
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()
    template.uid = uid
    try {
      await queryRunner.manager.save(template)
      await queryRunner.commitTransaction()
      await queryRunner.release() //con esto el queryRunner se desconecta, para que funcione hay que volverlo a conectar
      return this.findById(id)
      // await this.productRepostory.save(product);
      // return product;
    } catch (error) {
      await queryRunner.rollbackTransaction()
      await queryRunner.release()

      this.handleErrors(error, this.context, false, [baseErrors.DUPLICATE_ENTRY])
    }
  }

  async findAllWithFilterPaginated(payload: HotelServiceQueryDto) {
    return this.getRepository().findByFiltersPaginated(payload)
  }
}
