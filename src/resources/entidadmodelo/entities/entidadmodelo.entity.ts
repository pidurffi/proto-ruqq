import { ApiProperty } from '@nestjs/swagger'
import { Entity, Column, OneToMany } from 'typeorm'
import { IsString, MaxLength } from 'class-validator'

import { EntidadRelacion } from '../../entidad-relacion/entities/entidad-relacion.entity'
import { EntityBase } from '../../../common/entities/base.entity'

@Entity({ name: 'entidadmodelo' })
export class Entidadmodelo extends EntityBase {
  //id, uid, deletedAt, createdAt y updatedAt vienen de EntityBase

  @ApiProperty({
    description: 'Nombre de la entidad',
    nullable: false,
    uniqueItems: false,
  })
  @Column({ type: 'varchar', length: 50, nullable: false })
  @IsString()
  @MaxLength(50)
  nombre: string

  @Column({ type: 'varchar', length: 255, nullable: false })
  @IsString()
  @MaxLength(50)
  descripcion: string

  @ApiProperty({ description: 'Relaciones de la entidad', nullable: true })
  @OneToMany(() => EntidadRelacion, entidadRelacion => entidadRelacion.entidadModelo, {
    eager: true,
    //nullable: true, No hace nada de este lado de la relación
  })
  // El nombre de la propiedad debe estar en plural
  // Pero en este ejemplo no es buen plural
  entidadRelaciones: EntidadRelacion[]
}
