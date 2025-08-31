import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'

import { QuoteGeneratorService } from '../services/quote-generator.service'
import { QuoteGeneratorRequestDto, QuoteGeneratorResponseDto } from '../dto'
import { ValidRoles } from '../../../engine/auth/interfaces/'
import { GetUser, User, UserRoleGuard } from '../../../engine/auth/'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'

/**
 * QuoteGeneratorController - Controlador REST para generación de presupuestos formateados
 * 
 * RESPONSABILIDAD ÚNICA (SRP):
 * - Maneja únicamente las peticiones HTTP para generación de presupuestos
 * - Delega la lógica de negocio al QuoteGeneratorService
 * - Se encarga de autenticación, autorización y validación de entrada
 * 
 * SECURITY:
 * - Requiere autenticación JWT
 * - Control de acceso basado en roles (SUPER_ADMIN para administración)
 * - Validación de DTOs con class-validator
 */
@Controller('/quote-generator')
@ApiTags('Quote Generator')
export class QuoteGeneratorController {
  constructor(private readonly quoteGeneratorService: QuoteGeneratorService) {}

  /**
   * Genera un presupuesto formateado usando una plantilla específica
   * 
   * ENDPOINT: POST /quote-generator/generate
   * 
   * CASO DE USO:
   * - El vendedor selecciona fechas, número de huéspedes y una plantilla
   * - El sistema calcula precios y ensambla el texto final
   * - Retorna el presupuesto completo listo para copiar y pegar
   * 
   * AUTENTICACIÓN:
   * - Requiere token JWT válido
   * - Acceso permitido a usuarios autenticados (vendedores)
   * 
   * @param dto Datos de la solicitud (fechas, pax, templateId)
   * @param user Usuario autenticado
   * @returns Presupuesto formateado como texto completo
   * @throws BadRequestException Si los datos son inválidos
   * @throws NotFoundException Si la plantilla no existe
   */
  @Post('/generate')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: QuoteGeneratorRequestDto, required: true })
  @ApiOkResponse({ 
    type: QuoteGeneratorResponseDto, 
    description: 'Presupuesto generado exitosamente' 
  })
  @ApiBadRequestResponse({ 
    description: 'Datos de entrada inválidos o plantilla sin bloques configurados' 
  })
  @ApiNotFoundResponse({ 
    description: 'Plantilla no encontrada' 
  })
  @ApiForbiddenResponse({ 
    description: 'Acceso denegado - Autenticación requerida' 
  })
  @UseGuards(AuthGuard())
  async generateFormattedQuote(
    @Body() dto: QuoteGeneratorRequestDto,
    @GetUser() user: User
  ): Promise<QuoteGeneratorResponseDto> {
    return await this.quoteGeneratorService.generateFormattedQuote(dto)
  }
}