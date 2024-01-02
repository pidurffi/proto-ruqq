import { Column, CreateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { IsUUID } from 'class-validator'

export class EntityBase {
  @ApiProperty({
    description: 'Id',
    type: String,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  @ApiProperty({
    description: 'ID del usuario que realizó la operación',
  })
  @IsUUID()
  uid: string

  @DeleteDateColumn({ select: false, nullable: true })
  deletedAt?: Date

  @ApiProperty({
    description: 'Creation Date',
    type: Date,
  })
  @CreateDateColumn()
  createdAt?: Date

  @ApiProperty({
    description: 'Updated Date',
    type: Date,
  })
  @UpdateDateColumn()
  updatedAt?: Date
}
