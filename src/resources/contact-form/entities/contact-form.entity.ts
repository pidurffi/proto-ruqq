import { Entity, Column } from 'typeorm'
import { IsString, MaxLength, IsEmail, IsDate, IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

import { EntityBase } from '../../../common/entities/base.entity'

@Entity({ name: 'contact-form' })
export class ContactForm extends EntityBase {
  @ApiProperty({ description: 'Nombre del contacto' })
  @IsString()
  @MaxLength(255)
  @Column({ type: 'text', nullable: false })
  name: string

  @ApiProperty({ description: 'Teléfono del contacto' })
  @IsString()
  @MaxLength(20)
  @Column({ type: 'text', nullable: false })
  phone: string

  @ApiProperty({ description: 'Correo electrónico del contacto' })
  @IsEmail()
  @MaxLength(255)
  @Column({ type: 'text', nullable: false })
  email: string

  @ApiProperty({ description: 'Fecha de inicio del contacto' })
  @IsOptional()
  @IsDate()
  @Column({ type: 'date', nullable: true })
  dateIn?: Date

  @ApiProperty({ description: 'Fecha de fin del contacto' })
  @IsOptional()
  @IsDate()
  @Column({ type: 'date', nullable: true })
  dateOut?: Date

  @ApiProperty({ description: 'Mensaje del contacto' })
  @IsString()
  @MaxLength(1000)
  @Column({ type: 'text', nullable: false })
  message: string
}
