import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsString } from 'class-validator'
import { Transform } from 'class-transformer'

import { RequestPaginationDto } from '../../../common/dto/pagination.dto'
import { Popup } from '../entities/popup.entity'

export class PopupDto extends OmitType(Popup, [
  'imgPath',
  'imgThumbPath',
  'uid',
  'id',
  'createdAt',
  'deletedAt',
  'updatedAt',
] as const) {
  @ApiProperty({ description: 'Indica si el banner está habilitado' })
  @IsBoolean()
  @Transform(({ value }) => {
    return String(value).trim().toLowerCase() === 'true'
  })
  enabled: boolean
}

export class UpdatePopupDto extends PartialType(PopupDto) {}

export class PopupQueryDto extends RequestPaginationDto {
  @ApiProperty({ description: 'Dummy filter', required: false })
  @IsString()
  @IsOptional()
  dummy?: string
}

// export class PopupPaginationDto extends PaginationDto<Popup> {
//   @ApiProperty({ type: Popup, isArray: true })
//   data: Popup[]
// }
