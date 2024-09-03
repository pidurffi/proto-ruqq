import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsOptional, IsString, IsUUID } from 'class-validator'

import { RequestPaginationDto } from '../../../common/dto/pagination.dto'
import { SectionImg } from '../entities/section-img.entity'

export class SectionImgDto extends OmitType(SectionImg, [
  'id',
  'uid',
  'imgPath',
  'imgThumbPath',
  'createdAt',
  'deletedAt',
  'updatedAt',
] as const) {
  @IsUUID()
  sectionId: string
}

export class UpdateSectionImgDto extends PartialType(SectionImgDto) {}

export class SectionImgQueryDto extends RequestPaginationDto {
  @ApiProperty({ description: 'Dummy filter', required: false })
  @IsString()
  @IsOptional()
  dummy?: string
}
