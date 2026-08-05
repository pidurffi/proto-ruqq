import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'

import { DailyRatesService } from '../services/daily-room-rates.service'
import { DailyRateCreateDto, DailyRateBulkDto } from '../dto'
import { ValidRoles } from '../../../engine/auth/interfaces/'
import { GetUser, User, UserRoleGuard } from '../../../engine/auth/'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'

/**
 * DailyRoomRatesController - API REST para modelo OTA estándar
 * 
 * ENDPOINTS OPTIMIZADOS PARA OTAS:
 * - GET /rates/period - Obtener tarifas para rango (cotizaciones)
 * - POST /rates/bulk - Configurar temporada completa (bulk)
 * - PUT /rates/:id/availability - Actualizar disponibilidad (bookings)
 * - GET /rates/:roomTypeId/stats - Estadísticas de ocupación
 * 
 * COMPATIBLE CON:
 * - Channel Managers (importación masiva)
 * - Revenue Management Systems (pricing dinámico)  
 * - Booking Engines (consultas en tiempo real)
 * - APIs de OTAs (estructura estándar)
 */
@Controller('/daily-room-rates')
@ApiTags('Daily Room Rates - OTA Standard Model')
export class DailyRoomRatesController {
  constructor(private readonly dailyRatesService: DailyRatesService) {}

  //========================================
  // ENDPOINTS PRINCIPALES - ESTILO OTA
  //========================================

  @Get('/rates/period')
  @ApiOperation({ 
    summary: 'Obtener tarifas para rango de fechas',
    description: 'Query principal para cotizaciones. Equivale a XML Booking.com: <roomrate date="..." price="..." />'
  })
  @ApiQuery({ name: 'roomTypeId', description: 'ID del tipo de habitación' })
  @ApiQuery({ name: 'startDate', description: 'Fecha inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: 'Fecha fin (YYYY-MM-DD)' })
  @ApiQuery({ name: 'onlyAvailable', description: 'Solo días con disponibilidad', required: false })
  @ApiOkResponse({ description: 'Tarifas obtenidas exitosamente' })
  @ApiBadRequestResponse({ description: 'Parámetros de fecha inválidos' })
  @ApiForbiddenResponse({ description: 'Requiere rol SUPER_ADMIN.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async getRatesForPeriod(
    @Query('roomTypeId', ParseUUIDPipe) roomTypeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('onlyAvailable') onlyAvailable?: boolean,
  ) {
    return this.dailyRatesService.getRatesForPeriod(
      roomTypeId,
      startDate,
      endDate,
      onlyAvailable ?? true
    )
  }

  @Post('/rates/bulk')
  @ApiOperation({ 
    summary: 'Configurar tarifas para temporada completa',
    description: 'Operación bulk para Channel Managers. Configura precio para rango completo de fechas'
  })
  @ApiBody({ type: DailyRateBulkDto })
  @ApiCreatedResponse({ description: 'Temporada configurada exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos de temporada inválidos' })
  @ApiForbiddenResponse({ description: 'Requiere rol SUPER_ADMIN.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async setRatesForSeason(
    @Body() bulkDto: DailyRateBulkDto,
    @GetUser() user: User
  ) {
    await this.dailyRatesService.setRatesForPeriod(
      bulkDto.roomTypeId,
      bulkDto.startDate.toString(),
      bulkDto.endDate.toString(),
      bulkDto.baseRate,
      bulkDto.availableRooms,
      user.id,
      {
        singleOccupancyRate: bulkDto.singleOccupancyRate,
        extraPersonRate: bulkDto.extraPersonRate,
        minStay: bulkDto.minStay,
        maxStay: bulkDto.maxStay,
        closedToArrival: bulkDto.closedToArrival,
        closedToDeparture: bulkDto.closedToDeparture,
        pricingSource: bulkDto.pricingSource,
        dayOfWeekFilter: bulkDto.dayOfWeekFilter
      }
    )

    return {
      success: true,
      message: `Temporada configurada desde ${bulkDto.startDate} hasta ${bulkDto.endDate}`,
      roomTypeId: bulkDto.roomTypeId
    }
  }

  @Post('/rates/single')
  @ApiOperation({ 
    summary: 'Configurar tarifa para día específico',
    description: 'Para ajustes puntuales o pricing dinámico por día'
  })
  @ApiBody({ type: DailyRateCreateDto })
  @ApiCreatedResponse({ description: 'Tarifa diaria configurada exitosamente' })
  @ApiForbiddenResponse({ description: 'Requiere rol SUPER_ADMIN.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async setSingleDayRate(
    @Body() createDto: DailyRateCreateDto,
    @GetUser() user: User
  ) {
    await this.dailyRatesService.setRatesForPeriod(
      createDto.roomTypeId,
      createDto.date.toString(),
      createDto.date.toString(),
      createDto.baseRate,
      createDto.availableRooms,
      user.id,
      {
        singleOccupancyRate: createDto.singleOccupancyRate,
        extraPersonRate: createDto.extraPersonRate,
        minStay: createDto.minStay,
        maxStay: createDto.maxStay,
        closedToArrival: createDto.closedToArrival,
        closedToDeparture: createDto.closedToDeparture,
        pricingSource: createDto.pricingSource
      }
    )

    return {
      success: true,
      message: `Tarifa configurada para ${createDto.date}`,
      roomTypeId: createDto.roomTypeId,
      date: createDto.date
    }
  }

  //========================================
  // GESTIÓN DE DISPONIBILIDAD - TIEMPO REAL
  //========================================

  @Put('/rates/:roomTypeId/:date/availability')
  @ApiOperation({ 
    summary: 'Actualizar disponibilidad para booking/cancelación',
    description: 'Para sistemas de reserva en tiempo real. Suma/resta habitaciones disponibles'
  })
  @ApiParam({ name: 'roomTypeId', description: 'ID del tipo de habitación' })
  @ApiParam({ name: 'date', description: 'Fecha (YYYY-MM-DD)' })
  @ApiBody({ 
    schema: {
      properties: {
        roomsChange: { 
          type: 'number',
          description: 'Cambio en disponibilidad: negativo para booking, positivo para cancelación',
          example: -1
        }
      }
    }
  })
  @ApiOkResponse({ description: 'Disponibilidad actualizada exitosamente' })
  @ApiForbiddenResponse({ description: 'Requiere rol SUPER_ADMIN.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async updateAvailability(
    @Param('roomTypeId', ParseUUIDPipe) roomTypeId: string,
    @Param('date') date: string,
    @Body('roomsChange') roomsChange: number
  ) {
    await this.dailyRatesService.updateAvailability(roomTypeId, date, roomsChange)

    return {
      success: true,
      message: `Disponibilidad actualizada para ${date}`,
      roomTypeId,
      date,
      change: roomsChange
    }
  }

  @Get('/rates/:roomTypeId/missing-dates')
  @ApiOperation({ 
    summary: 'Encontrar fechas faltantes en calendario',
    description: 'Para detectar huecos en configuración de tarifas'
  })
  @ApiParam({ name: 'roomTypeId', description: 'ID del tipo de habitación' })
  @ApiQuery({ name: 'startDate', description: 'Fecha inicio del rango a verificar' })
  @ApiQuery({ name: 'endDate', description: 'Fecha fin del rango a verificar' })
  @ApiForbiddenResponse({ description: 'Requiere rol SUPER_ADMIN.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async findMissingDates(
    @Param('roomTypeId', ParseUUIDPipe) roomTypeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    const missingDates = await this.dailyRatesService['repository'].findMissingDatesInRange(
      roomTypeId,
      startDate,
      endDate
    )

    return {
      roomTypeId,
      period: { startDate, endDate },
      missingDates: missingDates.map(date => date.toISOString().split('T')[0]),
      count: missingDates.length
    }
  }

  @Post('/rates/:roomTypeId/fill-missing')
  @ApiOperation({ 
    summary: 'Llenar fechas faltantes con tarifas por defecto',
    description: 'Para completar calendario después de crear room types'
  })
  @ApiParam({ name: 'roomTypeId', description: 'ID del tipo de habitación' })
  @ApiBody({ 
    schema: {
      properties: {
        startDate: { type: 'string', format: 'date' },
        endDate: { type: 'string', format: 'date' },
        defaultRate: { type: 'number', example: 100.00 },
        defaultAvailableRooms: { type: 'number', example: 5 }
      }
    }
  })
  @ApiForbiddenResponse({ description: 'Requiere rol SUPER_ADMIN.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async fillMissingDates(
    @Param('roomTypeId', ParseUUIDPipe) roomTypeId: string,
    @Body() fillDto: {
      startDate: string
      endDate: string
      defaultRate: number
      defaultAvailableRooms: number
    },
    @GetUser() user: User
  ) {
    const filledCount = await this.dailyRatesService.fillMissingDates(
      roomTypeId,
      fillDto.startDate,
      fillDto.endDate,
      fillDto.defaultRate,
      fillDto.defaultAvailableRooms,
      user.id
    )

    return {
      success: true,
      message: `Completadas ${filledCount} fechas faltantes`,
      roomTypeId,
      filledCount
    }
  }

  //========================================
  // ESTADÍSTICAS Y REPORTES
  //========================================

  @Get('/rates/:roomTypeId/stats')
  @ApiOperation({ 
    summary: 'Estadísticas de ocupación y precios',
    description: 'Para dashboards de Revenue Management'
  })
  @ApiParam({ name: 'roomTypeId', description: 'ID del tipo de habitación' })
  @ApiQuery({ name: 'startDate', description: 'Fecha inicio para estadísticas' })
  @ApiQuery({ name: 'endDate', description: 'Fecha fin para estadísticas' })
  @ApiForbiddenResponse({ description: 'Requiere rol SUPER_ADMIN.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async getOccupancyStats(
    @Param('roomTypeId', ParseUUIDPipe) roomTypeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    const stats = await this.dailyRatesService['repository'].getOccupancyStats(
      roomTypeId,
      startDate,
      endDate
    )

    return {
      roomTypeId,
      period: { startDate, endDate },
      stats: {
        totalDays: stats.totalDays,
        availableDays: stats.availableDays,
        occupancyRate: stats.totalDays > 0 ? 
          ((stats.totalDays - stats.availableDays) / stats.totalDays * 100).toFixed(1) + '%' : 
          '0%',
        avgRate: Number(stats.avgRate.toFixed(2)),
        totalInventory: stats.totalInventory
      }
    }
  }
}