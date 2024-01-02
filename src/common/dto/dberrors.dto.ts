import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
export class EpGenericErrorDto {
  @ApiProperty({
    description: `Codigo del error`,
  })
  @IsString()
  code: string

  @ApiProperty({
    description: `Error detail`,
  })
  @IsString()
  detail: string
}

export class DberrorsDto {
  @ApiProperty({
    description: `Error en cualquier formato`,
  })
  error: EpGenericErrorDto

  @ApiProperty({
    description: `Roles del usuario`,
    isArray: true,
  })
  @IsString({ each: true })
  errorsToCheck: string[]

  @ApiProperty({
    description: `Modulo o Contexto del error`,
  })
  @IsString()
  @IsOptional()
  context: string
}
