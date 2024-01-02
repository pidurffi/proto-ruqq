import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm'
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator'

import { EntityBase } from '../../../common/entities/base.entity'

@Entity('users')
export class User extends EntityBase {
  @Column('text', {
    unique: true,
  })
  @IsString()
  @IsEmail()
  email: string

  @Column('text', {
    select: false,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'The password must have a Uppercase, lowercase letter and a number',
  })
  password: string

  @Column('text')
  @IsString()
  @MinLength(3)
  fullName: string

  @Column('bool', { default: true })
  isActive: boolean

  @Column('text', {
    array: true,
    default: ['user'],
  })
  roles: string[]

  @BeforeInsert()
  checkFieldsBeforeInsert() {
    this.email = this.email.toLocaleLowerCase().trim()
  }

  @BeforeUpdate()
  checkFieldsBeforeUpdate() {
    this.checkFieldsBeforeInsert()
  }
}
