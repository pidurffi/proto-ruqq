import { ApiProperty } from '@nestjs/swagger'
import { 
  IsBoolean, 
  IsEmail, 
  IsInt, 
  IsString, 
  ValidateNested, 
  IsOptional,
  Min,
  Max 
} from 'class-validator'
import { Type } from 'class-transformer'

export class AuthMailDto {
  @ApiProperty({
    description: 'Username for SMTP authentication',
    example: 'user@example.com'
  })
  @IsString()
  @IsEmail({}, { message: 'Auth user must be a valid email' })
  user: string

  @ApiProperty({
    description: 'Password for SMTP authentication',
    example: 'your-app-password'
  })
  @IsString()
  pass: string
}

export class ConfigMailDto {
  @ApiProperty({
    description: 'SMTP server port',
    example: 587,
    minimum: 1,
    maximum: 65535
  })
  @IsInt()
  @Min(1)
  @Max(65535)
  port: number

  @ApiProperty({
    description: 'SMTP server host',
    example: 'smtp.gmail.com'
  })
  @IsString()
  host: string

  @ApiProperty({
    description: 'Use SSL/TLS encryption',
    example: false
  })
  @IsBoolean()
  secure: boolean

  @ApiProperty({
    description: 'Require TLS for connection',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  requireTLS?: boolean

  @ApiProperty({
    description: 'Use connection pooling',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  pool?: boolean

  @ApiProperty({
    description: 'Authentication credentials',
    type: AuthMailDto
  })
  @ValidateNested()
  @Type(() => AuthMailDto)
  auth: AuthMailDto

  @ApiProperty({
    description: 'Default sender email address',
    example: 'noreply@example.com',
    required: false
  })
  @IsOptional()
  @IsString()
  @IsEmail({}, { message: 'From address must be a valid email' })
  from?: string

  @ApiProperty({
    description: 'Maximum number of connections in pool',
    example: 5,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxConnections?: number

  @ApiProperty({
    description: 'Maximum messages per connection',
    example: 100,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxMessages?: number
}
