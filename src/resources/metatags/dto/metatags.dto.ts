import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

import { RequestPaginationDto } from '../../../common/dto/pagination.dto'
import { Metatags } from '../entities/metatags.entity'

export class MetatagsDto extends OmitType(Metatags, ['uid', 'id', 'createdAt', 'deletedAt', 'updatedAt'] as const) {}

export class UpdateMetatagsDto extends PartialType(MetatagsDto) {}

export class MetatagsQueryDto extends RequestPaginationDto {
  @ApiProperty({ description: 'Dummy filter', required: false })
  @IsString()
  @IsOptional()
  dummy?: string
}

// export class MetatagsPaginationDto extends PaginationDto<Metatags> {
//   @ApiProperty({ type: Metatags, isArray: true })
//   data: Metatags[]
// }
