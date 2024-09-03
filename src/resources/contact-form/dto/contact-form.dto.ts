import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsDate, IsOptional, IsString } from 'class-validator'
import { Transform } from 'class-transformer'

import { RequestPaginationDto } from '../../../common/dto/pagination.dto'
import { ContactForm } from '../entities/contact-form.entity'

export class ContactFormDto extends OmitType(ContactForm, [
  'uid',
  'id',
  'createdAt',
  'deletedAt',
  'updatedAt',
] as const) {
  @Transform(({ value }) => new Date(value))
  @IsOptional()
  @IsDate()
  dateIn?: Date

  @Transform(({ value }) => new Date(value))
  @IsOptional()
  @IsDate()
  dateOut?: Date
}

export class UpdateContactFormDto extends PartialType(ContactFormDto) {}

export class ContactFormQueryDto extends RequestPaginationDto {
  @ApiProperty({ description: 'Dummy filter', required: false })
  @IsString()
  @IsOptional()
  dummy?: string
}

// export class ContactFormPaginationDto extends PaginationDto<ContactForm> {
//   @ApiProperty({ type: ContactForm, isArray: true })
//   data: ContactForm[]
// }
