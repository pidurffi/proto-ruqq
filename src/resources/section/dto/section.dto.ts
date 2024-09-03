import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

import { RequestPaginationDto } from '../../../common/dto/pagination.dto'
import { Section } from '../entities/section.entity'

export class SectionDto extends OmitType(Section, ['uid', 'id', 'createdAt', 'deletedAt', 'updatedAt'] as const) {}

export class UpdateSectionDto extends PartialType(SectionDto) {}

export class SectionQueryDto extends RequestPaginationDto {
  @ApiProperty({ description: 'Dummy filter', required: false })
  @IsString()
  @IsOptional()
  dummy?: string
}
