import { Repository } from 'typeorm'
import { ExtractJwt, Strategy } from 'passport-jwt'

import { PassportStrategy } from '@nestjs/passport'
import { ConfigService } from '@nestjs/config'
import { UnauthorizedException, Injectable, Inject } from '@nestjs/common'

import { User } from '../entities/user.entity'
import { JwtPayload } from '../interfaces/jwt-payload.interface'
import { repositories } from '../constants'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(repositories.AUTH_REPOSITORY)
    private readonly userRepository: Repository<User>,

    configService: ConfigService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET')

    if (!jwtSecret) {
      throw new Error('JWT_SECRET no está definido en la configuración')
    }

    super({
      secretOrKey: jwtSecret,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    })
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { id } = payload

    const user = await this.userRepository.findOneBy({ id })

    if (!user) throw new UnauthorizedException('Token not valid')
    if (!user.isActive) throw new UnauthorizedException('Token not active')

    return user
  }
}
