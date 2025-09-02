import {
  Body,
  Controller,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'

import { CalendarService } from '../services/calendar.service'
import { CalendarBulkEditDto } from '../dto'
import { ValidRoles } from '../../../engine/auth/interfaces/'
import { GetUser, User, UserRoleGuard } from '../../../engine/auth/'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'

@Controller('/admin/calendar')
@ApiTags('Calendar Management')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class CalendarController {
  constructor(@Inject(CalendarService) private readonly calendarService: CalendarService) {}

  /**
   * Endpoint principal: Edición masiva de calendario
   * 
   * ABSTRACCIÓN DE ALTO NIVEL:
   * - El cliente no necesita saber si va a crear price_rules o modificar base_rate_period
   * - El sistema decide automáticamente basado en la selección de días
   * - API unificada y semánticamente clara
   */
  @Post('/bulk-edit')
  @ApiBody({ type: CalendarBulkEditDto, required: true })
  @ApiCreatedResponse({ 
    description: 'Bulk calendar edit applied successfully',
    schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['base_rate_modified', 'price_rules_created'],
          description: 'Acción ejecutada por el sistema'
        },
        result: {
          type: 'object',
          description: 'Resultado de la operación (base_rate_period o price_rules)'
        },
        summary: {
          type: 'object',
          properties: {
            roomTypesAffected: { type: 'number' },
            daysSelected: { type: 'array', items: { type: 'number' } },
            dateRange: { 
              type: 'object',
              properties: {
                startDate: { type: 'string' },
                endDate: { type: 'string' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Calendar bulk edit executed successfully.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request. Check your data.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async bulkEdit(@Body() bulkEditDto: CalendarBulkEditDto, @GetUser() user: User) {
    const result = await this.calendarService.bulkEdit(bulkEditDto, user.id)
    
    return {
      action: bulkEditDto.daysOfWeek.length === 7 ? 'base_rate_modified' : 'price_rules_created',
      result,
      summary: {
        roomTypesAffected: bulkEditDto.roomTypeIds.length,
        daysSelected: bulkEditDto.daysOfWeek,
        dateRange: {
          startDate: bulkEditDto.startDate,
          endDate: bulkEditDto.endDate
        }
      }
    }
  }

  /**
   * Preview de los cambios antes de aplicarlos
   * 
   * FUNCIONALIDAD DE SIMULACIÓN:
   * - Permite al usuario ver el impacto antes de confirmar
   * - Identifica qué strategy se va a usar
   * - Calcula estimaciones de cambios
   */
  @Post('/bulk-edit/preview')
  @ApiBody({ type: CalendarBulkEditDto, required: true })
  @ApiOkResponse({
    description: 'Preview of bulk edit changes',
    schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['modify_base_rates', 'create_price_rules'],
          description: 'Estrategia que se aplicará'
        },
        impactedRoomTypes: {
          type: 'number',
          description: 'Número de tipos de habitación afectados'
        },
        impactedNights: {
          type: 'number', 
          description: 'Número total de noches que cambiarán'
        },
        estimatedChanges: {
          type: 'array',
          description: 'Detalles de los cambios por tipo de habitación'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Preview generated successfully.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async previewBulkEdit(@Body() bulkEditDto: CalendarBulkEditDto) {
    return await this.calendarService.previewBulkEdit(bulkEditDto)
  }
}