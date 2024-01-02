import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsEmail, IsString } from 'class-validator'

//import { ValidModules } from '../interfaces'

export class PromoteUserDto {
  @ApiProperty({
    description: `Mail del usuario`,
    minLength: 3,
    nullable: false,
    uniqueItems: true,
  })
  @IsString()
  @IsEmail()
  email: string

  @ApiProperty({
    description: `Roles del usuario`,
    //enum: ValidModules,
  })
  //todo: pendiente ver como crear un decorator que valide consultando al service de roles
  //@IsIn(Object.values(ValidModules), { each: true })
  @IsString({ each: true })
  @IsArray()
  roles: string[]
}
