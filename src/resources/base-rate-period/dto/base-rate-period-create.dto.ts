import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsNumber, IsDateString, IsPositive } from 'class-validator'

export class BaseRatePeriodCreateDto {
  @ApiProperty({
    description: 'ID del tipo de habitación',
    example: 1
  })
  @IsNumber()
  @IsNotEmpty()
  roomTypeId: number

  @ApiProperty({
    description: 'Fecha de inicio del período',
    example: '2024-01-01'
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: Date

  @ApiProperty({
    description: 'Fecha de fin del período',
    example: '2024-12-31'
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: Date

  @ApiProperty({
    description: 'Precio base que aplica a todo el rango',
    example: 150.50
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsNotEmpty()
  price: number
}
