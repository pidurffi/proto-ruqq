import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsDateString } from 'class-validator'

export class BaseRatePeriodBudgetDto {
  @ApiProperty({
    description: 'Número de huéspedes',
    example: 2
  })
  @IsNotEmpty()
  pax: number

  @ApiProperty({
    description: 'Fecha de check-in',
    example: '2024-10-10'
  })
  @IsDateString()
  @IsNotEmpty()
  checkInDate: Date

  @ApiProperty({
    description: 'Fecha de check-out',
    example: '2024-10-18'
  })
  @IsDateString()
  @IsNotEmpty()
  checkOutDate: Date
}

export class BudgetSegmentDto {
  @ApiProperty({
    description: 'Fecha de inicio del segmento',
    example: '2024-10-10'
  })
  startDate: string

  @ApiProperty({
    description: 'Fecha de fin del segmento',
    example: '2024-10-11'
  })
  endDate: string

  @ApiProperty({
    description: 'Precio por noche del segmento',
    example: 200.00
  })
  pricePerNight: number

  @ApiProperty({
    description: 'Número de noches en este segmento',
    example: 2
  })
  nights: number

  @ApiProperty({
    description: 'Subtotal del segmento',
    example: 400.00
  })
  subtotal: number
}

export class RoomTypeBudgetDto {
  @ApiProperty({
    description: 'Información del tipo de habitación'
  })
  roomType: {
    id: string
    name: string
    code: string
    baseCapacity: number
    maxCapacity: number
  }

  @ApiProperty({
    description: 'Total de noches',
    example: 8
  })
  totalNights: number

  @ApiProperty({
    description: 'Desglose por segmentos de tarifa',
    type: [BudgetSegmentDto]
  })
  segments: BudgetSegmentDto[]

  @ApiProperty({
    description: 'Precio total del presupuesto',
    example: 2132.00
  })
  totalPrice: number
}

export class BudgetResponseDto {
  @ApiProperty({
    description: 'Número de huéspedes solicitado',
    example: 2
  })
  pax: number

  @ApiProperty({
    description: 'Fecha de check-in',
    example: '2024-10-10'
  })
  checkInDate: string

  @ApiProperty({
    description: 'Fecha de check-out',
    example: '2024-10-18'
  })
  checkOutDate: string

  @ApiProperty({
    description: 'Array de tipos de habitación disponibles con sus precios',
    type: [RoomTypeBudgetDto]
  })
  availableRoomTypes: RoomTypeBudgetDto[]
}