import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

import { RequestPaginationDto } from '../../../common/dto/pagination.dto'
import { Equipment } from '../entities/equipment.entity'

export class EquipmentDto extends OmitType(Equipment, ['uid', 'id', 'createdAt', 'deletedAt', 'updatedAt'] as const) {}

export class UpdateEquipmentDto extends PartialType(EquipmentDto) {}

export class EquipmentQueryDto extends RequestPaginationDto {
  @ApiProperty({ description: 'Dummy filter', required: false })
  @IsString()
  @IsOptional()
  dummy?: string
}

// export class EquipmentPaginationDto extends PaginationDto<Equipment> {
//   @ApiProperty({ type: Equipment, isArray: true })
//   data: Equipment[]
// }
