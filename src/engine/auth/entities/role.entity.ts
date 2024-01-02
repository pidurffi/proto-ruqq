import { Column, Entity } from 'typeorm'
import { IsBoolean, IsIn, IsString, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

import { EntityBase } from '../../../common/entities/base.entity'
import { ValidModules } from '../interfaces'

@Entity('roles')
export class Role extends EntityBase {
  @ApiProperty({ description: 'Codigo Unico del Role', required: true })
  @IsString()
  @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
  @MaxLength(50)
  name: string

  @ApiProperty({ description: 'Descripción del Role', required: true })
  @IsString()
  @Column({ type: 'varchar', length: 100, nullable: false })
  @MaxLength(50)
  description: string

  @ApiProperty({ description: 'Role Activo' })
  @IsBoolean()
  @Column('bool', { default: true })
  isActive: boolean

  /* @ApiProperty({ description: 'Modulos a los tiene permisos el role' })
  @Column('text', {
    array: true,
    default: [],
  })
  @IsArray()
  @IsEnum(ValidModules, { each: true }) */

  @ApiProperty({
    description: `Modulos a los tiene permisos el role`,
    enum: ValidModules,
  })
  @IsIn(Object.values(ValidModules), { each: true })
  @Column('text', {
    array: true,
    default: [],
  })
  modules: string[]
}
