import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'

import { BaseRatePeriodService } from '../services/base-rate-period.service'
import { BaseRatePeriodQueryDto, BaseRatePeriodUpdateDto, BaseRatePeriodCreateDto, BaseRatePeriodBudgetDto, BudgetResponseDto } from '../dto'
import { BaseRatePeriod } from '../entities/base-rate-period.entity'
import { ValidRoles } from '../../../engine/auth/interfaces/'
import { GetUser, User, UserRoleGuard } from '../../../engine/auth/'
import { PaginationDto } from '../../../common/'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'
import { BaseController } from '../../../common/controllers/base.controller'

@Controller('/base-rate-period')
@ApiTags('BaseRatePeriod')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class BaseRatePeriodController extends BaseController<BaseRatePeriod> {
  constructor(@Inject(BaseRatePeriodService) private readonly service: BaseRatePeriodService) {
    super()
  }

  getService(): BaseRatePeriodService {
    return this.service
  }

  @Get('/')
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiResponse({
    status: 200,
    description: 'List BaseRatePeriod ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiOkResponse({ type: BaseRatePeriod })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async findAll(@Query() baseRatePeriodQueryDto: BaseRatePeriodQueryDto) {
    return this.getService().findAllWithFilterPaginated(baseRatePeriodQueryDto)
  }
  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'BaseRatePeriod ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiNotFoundResponse({ description: 'Not Found.' })
  @ApiOkResponse({ type: BaseRatePeriod, description: 'BaseRatePeriod detail' })
  @ApiNotFoundResponse({ description: 'BaseRatePeriod not found' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getService().findByIdOrFail(id)
  }

  @Post('/')
  @ApiBody({ type: BaseRatePeriodCreateDto, required: true })
  @ApiCreatedResponse({ type: BaseRatePeriod, description: 'BaseRatePeriod created' })
  @ApiResponse({
    status: 200,
    description: 'Post BaseRatePeriod ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async create(@Body() entity: BaseRatePeriodCreateDto, @GetUser() user: User) {
    return this.getService().createBaseRatePeriod(entity, user.id)
  }

  @Delete('/:id')
  @ApiResponse({
    status: 200,
    description: 'Delete BaseRatePeriod ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'BaseRatePeriod deleted' })
  @ApiNotFoundResponse({
    description: 'The BaseRatePeriod you want to delete does not exist',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.getService().delete(id)
  }

  @Patch('/:id')
  @ApiOkResponse({
    description: 'The record has been successfully updated.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiNotFoundResponse({ description: 'Not Found.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'BaseRatePeriod updated' })
  @ApiNotFoundResponse({
    description: 'The BaseRatePeriod you want to update does not exist',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async update(@Param('id') id: string, @Body() entity: BaseRatePeriodUpdateDto) {
    await this.getService().updateById(id, entity)
  }

  @Post('/budget')
  @ApiBody({ type: BaseRatePeriodBudgetDto, required: true })
  @ApiOkResponse({ 
    type: BudgetResponseDto, 
    description: 'Presupuesto calculado exitosamente' 
  })
  @ApiResponse({
    status: 200,
    description: 'Calculate budget for stay',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async calculateBudget(@Body() budgetDto: BaseRatePeriodBudgetDto): Promise<BudgetResponseDto> {
    return this.getService().calculateBudget(budgetDto)
  }
}
