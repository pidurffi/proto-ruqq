import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class SendMailDto {
  @ApiProperty({
    description: 'Email destination',
    required: true,
  })
  @IsString()
  sendTo?: string

  @ApiProperty({
    default: 'Cuerpo del mail',
    description: 'Mensaje del Cuerpo del mail',
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string

  @ApiProperty({
    default: 'Asunto del mail',
    description: 'Texto del Asunto del mail',
    required: false,
  })
  @IsOptional()
  @IsString()
  subject?: string
}
