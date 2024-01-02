import { ApiProperty, OmitType } from '@nestjs/swagger'
import { IsArray, IsString } from 'class-validator'

import { Role } from '../entities'

export class CreateRoleDto extends OmitType(Role, ['id', 'uid'] as const) {}

export class PromoteRoleDto {
  @ApiProperty({
    description: `Codigo del rol`,
    minLength: 3,
    nullable: false,
    uniqueItems: true,
  })
  @IsString()
  code: string

  @ApiProperty({
    description: `Roles del usuario`,
    //enum: ValidModules,
  })
  //todo: pendiente ver como crear un decorator que valide consultando al service de roles
  //@IsIn(Object.values(ValidModules), { each: true })
  @IsString({ each: true })
  @IsArray()
  modules: string[]
}
