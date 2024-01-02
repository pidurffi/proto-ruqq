import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

import { PaginationDto, RequestPaginationDto } from '../../../../common/dto/pagination.dto'
import { Template } from '../entities/template'

export class TemplateDto extends OmitType(Template, ['id', 'createdAt', 'deletedAt', 'updatedAt'] as const) {}

export class UpdateTemplateDto extends PartialType(TemplateDto) {}

export class TemplateQueryDto extends RequestPaginationDto {
  @ApiProperty({ description: 'Dummy filter', required: false })
  @IsString()
  @IsOptional()
  dummy?: string
}

export class TemplatePaginationDto extends PaginationDto<Template> {
  @ApiProperty({ type: Template, isArray: true })
  data: Template[]
}
