import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsEmail, IsString } from 'class-validator'

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
  })
  //todo: pendiente ver como crear un decorator que valide consultando al service de roles
  @IsString({ each: true })
  @IsArray()
  roles: string[]
}
