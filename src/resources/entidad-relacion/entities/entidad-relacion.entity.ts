import { ApiProperty } from '@nestjs/swagger'
import { Entity, Column, ManyToOne } from 'typeorm'
import { IsString, MaxLength } from 'class-validator'

import { Entidadmodelo } from '../../entidadmodelo/entities'
import { EntityBase } from '../../../common/entities/base.entity'

@Entity({ name: 'entidad_relacion' })
export class EntidadRelacion extends EntityBase {
  //id, uid, deletedAt, createdAt y updatedAt vienen de EntityBase

  @Column({ type: 'varchar', length: 50, nullable: false })
  @IsString()
  @MaxLength(50)
  @ApiProperty({
    description: 'Nombre de la entidad',
    nullable: false,
    uniqueItems: false,
  })
  nombre: string

  // Por lo que vi hasta ahora, el nullable: true va de este lado.
  @ManyToOne(() => Entidadmodelo, entidadModelo => entidadModelo.entidadRelaciones, {
    nullable: true,
  })
  entidadModelo?: Entidadmodelo
}
