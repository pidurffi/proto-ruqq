import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'

import { PriceMatrixService } from '../services/price-matrix.service'
import { PriceMatrixRequestDto, PriceMatrixResponseDto } from '../dto'
import { ValidRoles } from '../../../engine/auth/interfaces/'
import { GetUser, User, UserRoleGuard } from '../../../engine/auth/'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'

/**
 * PriceMatrixController - Controlador REST para matriz de precios
 * 
 * RESPONSABILIDAD ÚNICA (SRP):
 * - Maneja únicamente las peticiones HTTP para generación de matriz de precios
 * - Delega toda la lógica de negocio al PriceMatrixService
 * - Se encarga de autenticación, autorización y validación HTTP
 * 
 * SEGURIDAD:
 * - Requiere autenticación JWT
 * - Control de acceso basado en roles (SUPER_ADMIN)
 * - Validación de DTOs con class-validator
 * 
 * API DESIGN:
 * - Endpoint RESTful con verbo POST (debido a payload de fechas)
 * - Documentación OpenAPI/Swagger completa
 * - Respuestas HTTP semánticamente correctas
 */
@Controller('/admin/price-matrix')
@ApiTags('Price Matrix')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class PriceMatrixController {
  constructor(
    @Inject(PriceMatrixService) 
    private readonly priceMatrixService: PriceMatrixService
  ) {}

  /**
   * Genera matriz de precios para un rango de fechas
   * 
   * ENDPOINT: POST /admin/price-matrix/generate
   * 
   * CASO DE USO:
   * - El administrador selecciona un rango de fechas
   * - El sistema calcula precios aplicando Motor v2.3 para cada unidad/fecha
   * - Retorna matriz completa con estadísticas para visualización
   * 
   * MOTOR DE PRECIOS v2.3 APLICADO:
   * - Aplica base_rate_period como capa base
   * - Aplica price_rules como overrides/calcomanías
   * - Arquitectura preparada para futuras promociones
   * 
   * AUTENTICACIÓN:
   * - Requiere token JWT válido
   * - Solo acceso para SUPER_ADMIN
   * 
   * @param dto Parámetros de la solicitud (startDate, endDate)
   * @param user Usuario autenticado (para auditoría futura)
   * @returns Matriz completa con precios y estadísticas
   * @throws BadRequestException Si el rango de fechas es inválido
   * @throws ForbiddenException Si no tiene permisos de SUPER_ADMIN
   */
  @Post('/generate')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ 
    type: PriceMatrixRequestDto, 
    required: true,
    description: 'Parámetros para generar la matriz de precios'
  })
  @ApiOkResponse({ 
    type: PriceMatrixResponseDto, 
    description: 'Matriz de precios generada exitosamente'
  })
  @ApiBadRequestResponse({ 
    description: 'Rango de fechas inválido o tipos de habitación no configurados'
  })
  @ApiForbiddenResponse({ 
    description: 'Acceso denegado - Requiere permisos de SUPER_ADMIN'
  })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async generateMatrix(
    @Body() dto: PriceMatrixRequestDto,
    @GetUser() user: User
  ): Promise<PriceMatrixResponseDto> {
    return await this.priceMatrixService.generatePriceMatrix(dto)
  }
}