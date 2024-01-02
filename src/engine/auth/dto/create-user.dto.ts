import { OmitType } from '@nestjs/swagger'

import { User } from '../entities'

export class CreateUserDto extends OmitType(User, ['id', 'uid', 'createdAt', 'updatedAt', 'deletedAt'] as const) {}
