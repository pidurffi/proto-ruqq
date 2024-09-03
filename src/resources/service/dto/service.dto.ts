import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

import { RequestPaginationDto } from '../../../common/dto/pagination.dto'
import { Service } from '../entities/service.entity'

export class ServiceDto extends OmitType(Service, ['uid', 'id', 'createdAt', 'deletedAt', 'updatedAt'] as const) {}

export class UpdateServiceDto extends PartialType(ServiceDto) {}

export class ServiceQueryDto extends RequestPaginationDto {
  @ApiProperty({ description: 'Dummy filter', required: false })
  @IsString()
  @IsOptional()
  dummy?: string
}

// export class ServicePaginationDto extends PaginationDto<Service> {
//   @ApiProperty({ type: Service, isArray: true })
//   data: Service[]
// }
