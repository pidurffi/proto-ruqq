import { ApiProperty } from '@nestjs/swagger'

/**
 * Códigos de motivos por los cuales una habitación puede ser rechazada
 */
export enum RejectionReasonCode {
  CAPACITY_EXCEEDED = 'CAPACITY_EXCEEDED',
  MIN_STAY_NOT_MET = 'MIN_STAY_NOT_MET',
  MAX_STAY_EXCEEDED = 'MAX_STAY_EXCEEDED',
  CLOSED_TO_ARRIVAL = 'CLOSED_TO_ARRIVAL',
  CLOSED_TO_DEPARTURE = 'CLOSED_TO_DEPARTURE',
  NO_RATES_CONFIGURED = 'NO_RATES_CONFIGURED'
}

/**
 * DTO que representa una habitación no disponible con el motivo específico
 * Mejora la UX proporcionando información transparente sobre por qué no está disponible
 */
export class UnavailableRoomTypeDto {
  @ApiProperty({
    description: 'Información del tipo de habitación no disponible'
  })
  roomType: {
    id: string
    name: string
    code: string
    baseCapacity: number
    maxCapacity: number
  }

  @ApiProperty({
    description: 'Código del motivo de rechazo',
    enum: RejectionReasonCode,
    example: RejectionReasonCode.CAPACITY_EXCEEDED
  })
  reasonCode: RejectionReasonCode

  @ApiProperty({
    description: 'Mensaje explicativo legible para el usuario',
    example: 'La cantidad de huéspedes (5) excede la capacidad máxima (4).'
  })
  reasonMessage: string
}