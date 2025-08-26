import { ApiProperty } from '@nestjs/swagger'
import { 
  IsEmail, 
  IsOptional, 
  IsString, 
  IsArray, 
  ValidateNested, 
  IsEnum,
  MinLength,
  MaxLength 
} from 'class-validator'
import { Type, Transform } from 'class-transformer'

export enum EmailPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high'
}

export class AttachmentDto {
  @ApiProperty({
    description: 'Filename for the attachment',
    example: 'document.pdf'
  })
  @IsString()
  @MinLength(1)
  filename: string

  @ApiProperty({
    description: 'File path or buffer content'
  })
  @IsString()
  path: string

  @ApiProperty({
    description: 'Content type of the file',
    example: 'application/pdf',
    required: false
  })
  @IsOptional()
  @IsString()
  contentType?: string
}

export class SendMailDto {
  @ApiProperty({
    description: 'Email destination address',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail({}, { message: 'Invalid email format for destination' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  to: string

  @ApiProperty({
    description: 'Reply-to email address',
    example: 'noreply@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format for reply-to' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  replyTo?: string

  @ApiProperty({
    description: 'Carbon copy recipients',
    type: [String],
    required: false,
    example: ['cc1@example.com', 'cc2@example.com']
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true, message: 'Invalid email format in CC list' })
  @Transform(({ value }) => value?.map((email: string) => email?.toLowerCase().trim()))
  cc?: string[]

  @ApiProperty({
    description: 'Blind carbon copy recipients',
    type: [String],
    required: false,
    example: ['bcc1@example.com', 'bcc2@example.com']
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true, message: 'Invalid email format in BCC list' })
  @Transform(({ value }) => value?.map((email: string) => email?.toLowerCase().trim()))
  bcc?: string[]

  @ApiProperty({
    description: 'Email subject',
    example: 'Important notification',
    required: true,
  })
  @IsString()
  @MinLength(1, { message: 'Subject cannot be empty' })
  @MaxLength(255, { message: 'Subject too long' })
  subject: string

  @ApiProperty({
    description: 'Email message content (plain text)',
    example: 'This is the email content.',
    required: false,
  })
  @IsOptional()
  @IsString()
  text?: string

  @ApiProperty({
    description: 'Email message content (HTML)',
    example: '<p>This is the <strong>email content</strong>.</p>',
    required: false,
  })
  @IsOptional()
  @IsString()
  html?: string

  @ApiProperty({
    description: 'Template name to use for the email',
    example: 'welcome',
    required: false,
  })
  @IsOptional()
  @IsString()
  template?: string

  @ApiProperty({
    description: 'Template variables/context',
    example: { name: 'John Doe', company: 'ACME Corp' },
    required: false,
  })
  @IsOptional()
  context?: Record<string, any>

  @ApiProperty({
    description: 'Email priority',
    enum: EmailPriority,
    default: EmailPriority.NORMAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(EmailPriority)
  priority?: EmailPriority = EmailPriority.NORMAL

  @ApiProperty({
    description: 'File attachments',
    type: [AttachmentDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[]
}
