import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MaxLength, IsNumber, IsOptional, Min } from 'class-validator'

export class RoomTypeCreateDto {
  @ApiProperty({
    description: 'Nombre del tipo de habitación',
    example: 'Suite Doble',
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string

  @ApiProperty({
    description: 'Código corto del tipo de habitación',
    example: 'DBL_STE',
    maxLength: 10
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  code: string

  @ApiProperty({
    description: 'Cantidad total de habitaciones físicas de este tipo',
    example: 10,
    default: 1
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  totalInventory?: number
}
