import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { AuthService } from './services/'
import { AuthProviders } from './providers/auth.providers'
import { JwtStrategy } from './strategies/jwt.strategies'
import { DatabaseModule } from '../database/database.module'
import { CommonModule } from '../../common/common.module'
import { AuthController } from './controllers/auth.controller'

@Module({
  controllers: [AuthController],
  imports: [
    ConfigModule,
    DatabaseModule,
    CommonModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule], //importo el configModule para injectar el servicio
      inject: [ConfigService], //puedo injectar el servicio porque importe el configModule
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get('JWT_SECRET'),
          signOptions: {
            expiresIn: '2h',
          },
        }
      },
    }),
  ],
  providers: [...AuthProviders, AuthService, JwtStrategy],
  exports: [DatabaseModule, JwtStrategy, PassportModule, JwtModule, AuthService],
})
export class AuthModule {}
