import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsEmail, IsInt, IsString } from 'class-validator'

export class ConfigMailDto {
  @ApiProperty({
    description: `Port Service`,
  })
  @IsInt()
  port: number

  @ApiProperty({
    description: `Host Service`,
  })
  @IsString()
  host: string

  @ApiProperty({
    description: `Is secure`,
  })
  @IsBoolean()
  secure: boolean

  @ApiProperty({
    description: `Is TLS service`,
  })
  @IsBoolean()
  requireTLS: boolean

  @ApiProperty({
    description: `Is pool implementation: EJ smtps://username:password@smtp.example.com/?pool=true`,
  })
  @IsBoolean()
  pool: boolean

  @ApiProperty({
    description: `Authenticate to service`,
  })
  @IsString()
  auth: AuthMailDto

  @ApiProperty({
    description: `Mail From`,
  })
  @IsString()
  @IsEmail()
  from?: string
}

class AuthMailDto {
  @ApiProperty({
    description: `User for authentication service `,
  })
  @IsString()
  user: string

  @ApiProperty({
    description: `Password for authentication service`,
  })
  @IsString()
  pass: string
}
