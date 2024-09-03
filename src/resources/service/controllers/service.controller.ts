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

import { ServiceService } from '../services/service.service'
import { ServiceDto, ServiceQueryDto, UpdateServiceDto } from '../dto/service.dto'
import { Service } from '../entities/service.entity'
import { GetUser, User, UserRoleGuard } from '../../../engine/auth/'
import { ValidRoles } from '../../../engine/auth/interfaces/index'
import { RoleProtected } from '../../../engine/auth/decorators/role-protected.decorator'
import { BaseController } from '../../../common/controllers/base.controller'

@Controller('/service')
@ApiTags('Service')
@RoleProtected(ValidRoles.SUPER_ADMIN)
export class ServiceController extends BaseController<Service> {
  constructor(@Inject(ServiceService) private readonly service: ServiceService) {
    super()
  }

  getService(): ServiceService {
    return this.service
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'List Service ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiForbiddenResponse({ status: 403, description: 'Forbidden.' })
  // @ApiOkResponse({ type: ServicePaginationDto })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async findAll(@Query() query: ServiceQueryDto) {
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
  async getAllServices() {
    return this.getService().getAllServices()
  }

  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'Service ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNotFoundResponse({ status: 404, description: 'Not Found.' })
  @ApiOkResponse({ type: Service, description: 'Service detail' })
  @ApiNotFoundResponse({ description: 'Service not found' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getService().findByIdOrFail(id)
  }

  @Post('/')
  @ApiBody({ type: ServiceDto, required: true })
  @ApiCreatedResponse({ type: Service, description: 'Service created' })
  @ApiResponse({
    status: 200,
    description: 'Post Service ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async createService(@GetUser() user: User, @Body() serviceDto: ServiceDto) {
    return this.getService().createService(serviceDto, user.uid)
  }

  @Delete('/:id')
  @ApiResponse({
    status: 200,
    description: 'Delete Service ok.',
  })
  @ApiForbiddenResponse({ status: 401, description: 'Forbidden.' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @ApiNoContentResponse({ description: 'Service deleted' })
  @ApiNotFoundResponse({ description: 'The Service you want to delete does not exist' })
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
  @ApiNoContentResponse({ description: 'Service updated' })
  @ApiNotFoundResponse({ description: 'The Service you want to update does not exist' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoleProtected(ValidRoles.SUPER_ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  async update(@GetUser() user: User, @Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
    await this.getService().updateService(id, updateServiceDto, user.uid)
  }
}
