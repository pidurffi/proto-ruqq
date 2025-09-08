import {
  Body,
  Controller,
  Post,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'

import { QuoteEngineService } from '../services/quote-engine.service'
import { QuoteBudgetDto, QuoteResponseDto } from '../dto'

/**
 * QuotesController - Controller para cálculo de cotizaciones
 * 
 * RESPONSABILIDAD ÚNICA (SRP):
 * - Se encarga únicamente del endpoint de cálculo de cotizaciones
 * - Es un endpoint público para clientes
 * - NO maneja CRUD de entidades (quotes no necesita persistencia tradicional)
 * 
 * DOMAIN-DRIVEN DESIGN:
 * - Enfocado en casos de uso de dominio de cotización
 * - Orquesta servicios de dominio especializados
 */
@Controller('/quotes')
@ApiTags('Quotes')
export class QuotesController {
  constructor(private readonly quoteEngineService: QuoteEngineService) {}

  /**
   * Endpoint público para cálculo de cotizaciones
   * 
   * RESPONSABILIDAD:
   * - Punto de entrada para el motor de cotización de precios
   * - Validación de entrada a través de DTOs
   * - No requiere autenticación (público para clientes)
   * 
   * DOMAIN-DRIVEN DESIGN:
   * - Representa un caso de uso de negocio independiente
   * - Orquesta el servicio de dominio QuotesService
   * - Mantiene separation of concerns con validación y transformación
   */
  @Post('/calculate')
  @ApiBody({ type: QuoteBudgetDto, required: true })
  @ApiCreatedResponse({ 
    type: QuoteResponseDto, 
    description: 'Cotización calculada exitosamente' 
  })
  @ApiResponse({
    status: 200,
    description: 'Cotización de precios calculada',
  })
  @ApiBadRequestResponse({ 
    description: 'Parámetros de búsqueda inválidos - fechas incorrectas o capacidad excedida' 
  })
  async calculateQuote(@Body() quoteBudgetDto: QuoteBudgetDto): Promise<QuoteResponseDto> {
    return this.quoteEngineService.calculateQuote(quoteBudgetDto)
  }
}
