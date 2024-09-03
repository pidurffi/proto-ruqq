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

import { EquipmentService } from '../services/equipment.service'
import { EquipmentDto, EquipmentQueryDto, UpdateEquipmentDto } from '../dto/equipment.dto'
import { Equipment } from '../entities/equipment.entity'
import { GetUser, User, UserRoleGuard } from '../../../engine/auth/'
import { ValidRoles } from '../../../engine/auth/interfaces/index'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'
import { BaseController } from '../../../common/controllers/base.controller'

@Controller('/equipment')
@ApiTags('Equipment')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class EquipmentController extends BaseController<Equipment> {
  constructor(@Inject(EquipmentService) private readonly service: EquipmentService) {
    super()
  }

  getService(): EquipmentService {
    return this.service
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'List Equipment ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiForbiddenResponse({ status: 403, description: 'Forbidden.' })
  // @ApiOkResponse({ type: EquipmentPaginationDto })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async findAll(@Query() query: EquipmentQueryDto) {
    return this.getService().findAllWithFilterPaginated(query)
  }

  @Get('all')
  @ApiResponse({
    status: 200,
    description: 'List Equipment ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiForbiddenResponse({ status: 403, description: 'Forbidden.' })
  // @ApiOkResponse({ type: EquipmentPaginationDto })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async getAllEquipments() {
    return this.getService().getAllEquipments()
  }

  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'Equipment ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNotFoundResponse({ status: 404, description: 'Not Found.' })
  @ApiOkResponse({ type: Equipment, description: 'Equipment detail' })
  @ApiNotFoundResponse({ description: 'Equipment not found' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getService().findByIdOrFail(id)
  }

  @Post('/')
  @ApiBody({ type: EquipmentDto, required: true })
  @ApiCreatedResponse({ type: Equipment, description: 'Equipment created' })
  @ApiResponse({
    status: 200,
    description: 'Post Equipment ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async save(@GetUser() user: User, @Body() equipmentDto: EquipmentDto) {
    return this.getService().createEquipment(equipmentDto, user.uid)
  }

  @Delete('/:id')
  @ApiResponse({
    status: 200,
    description: 'Delete Equipment ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'Equipment deleted' })
  @ApiNotFoundResponse({ description: 'The Equipment you want to delete does not exist' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.getService().delete(id)
  }

  @Patch('/:id')
  @ApiOkResponse({
    status: 201,
    description: 'The record has been successfully updated.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiNotFoundResponse({ status: 404, description: 'Not Found.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'Equipment updated' })
  @ApiNotFoundResponse({ description: 'The Equipment you want to update does not exist' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async update(@Param('id') id: string, @Body() entity: UpdateEquipmentDto) {
    await this.getService().updateById(id, entity)
  }
}
