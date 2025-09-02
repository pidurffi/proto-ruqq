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

import { PriceRulesService } from '../services/price-rules.service'
import { PriceRulesQueryDto, UpdatePriceRuleDto, CreatePriceRuleDto, BulkCreatePriceRuleDto } from '../dto'
import { PriceRule } from '../entities/price-rules.entity'
import { ValidRoles } from '../../../engine/auth/interfaces/'
import { GetUser, User, UserRoleGuard } from '../../../engine/auth/'
import { PaginationDto } from '../../../common/'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'
import { BaseController } from '../../../common/controllers/base.controller'

@Controller('/admin/price-rules')
@ApiTags('Price Rules')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class PriceRulesController extends BaseController<PriceRule> {
  constructor(@Inject(PriceRulesService) private readonly service: PriceRulesService) {
    super()
  }

  getService(): PriceRulesService {
    return this.service
  }

  @Get('/')
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiResponse({
    status: 200,
    description: 'List PriceRules ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiOkResponse({ type: PriceRule })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async findAll(@Query() priceRulesQueryDto: PriceRulesQueryDto) {
    return this.getService().findAllWithFilterPaginated(priceRulesQueryDto)
  }

  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'Price rule detail.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiNotFoundResponse({ description: 'Not Found.' })
  @ApiOkResponse({ type: PriceRule, description: 'Price rule detail' })
  @ApiNotFoundResponse({ description: 'Price rule not found' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getService().findByIdOrFail(id)
  }

  @Post('/')
  @ApiBody({ type: CreatePriceRuleDto, required: true })
  @ApiCreatedResponse({ type: PriceRule, description: 'Price rule created' })
  @ApiResponse({
    status: 200,
    description: 'Price rule created successfully.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async create(@Body() entity: CreatePriceRuleDto, @GetUser() user: User) {
    return this.getService().createPriceRule(entity, user.id)
  }

  @Post('/bulk')
  @ApiBody({ type: BulkCreatePriceRuleDto, required: true })
  @ApiCreatedResponse({ type: [PriceRule], description: 'Price rules created in bulk' })
  @ApiResponse({
    status: 200,
    description: 'Bulk price rules created successfully.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async createBulk(@Body() entity: BulkCreatePriceRuleDto, @GetUser() user: User) {
    return this.getService().applyBulkPriceEdit(entity, user.id)
  }

  @Delete('/:id')
  @ApiResponse({
    status: 200,
    description: 'Delete PriceRules ok.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'PriceRules deleted' })
  @ApiNotFoundResponse({
    description: 'The PriceRules you want to delete does not exist',
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
  @ApiNoContentResponse({ description: 'Price rule updated' })
  @ApiNotFoundResponse({
    description: 'The price rule you want to update does not exist',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async update(@Param('id') id: string, @Body() entity: UpdatePriceRuleDto) {
    await this.getService().updateById(id, entity)
  }
}
