import { Not, Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { User } from '../entities/user.entity'
import { LoginUserDto, CreateUserDto, PromoteUserDto, UpdateUserDto } from '../dto'
import { JwtPayload } from '../interfaces/jwt-payload.interface'
import { repositories } from '../constants'
import { EploggerService, BaseService, baseErrors, DberrorsDto } from '../../../common'
import { EpGenericErrorDto } from '../../../common/dto/dberrors.dto'

@Injectable()
export class AuthService extends BaseService {
  private context = 'AuthModule'

  constructor(
    @Inject(repositories.AUTH_REPOSITORY)
    private readonly userRepository: Repository<User>,
    protected readonly logger: EploggerService,
    private readonly jwtService: JwtService,
  ) {
    super(logger)
  }

  async getAllUsers() {
    return this.userRepository.find({
      where: {
        email: Not('superadmin@superadmin.com'),
      },
    })
  }

  async create(createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto
    try {
      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
        // Arreglar esta bosta...
        uid: '550e8400-e29b-41d4-a716-446655440000',
      })

      await this.userRepository.save(user)

      return {
        ...user,
        token: this.getJwtToken({ id: user.id }),
        password: undefined,
      }
    } catch (error) {
      const baseerror: DberrorsDto = {
        error: error as EpGenericErrorDto,
        errorsToCheck: [baseErrors.DUPLICATE_ENTRY],
        context: this.context,
      }
      this.handleDBErrors(baseerror)
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto, user: User) {
    const userNew = await this.userRepository.preload({ id, ...updateUserDto })
    if (!userNew) throw new BadRequestException(`[${this.context}]Usuario con id: ${id} no encontrado`)

    await this.userRepository.save({ ...userNew, uid: user.id })
  }

  async login(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto

    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
      select: { email: true, password: true, id: true },
    })
    if (!user) {
      this.logger.error({
        message: `Usuario no tiene permisos`,
        sendEmail: true,
        stack: UnauthorizedException.name,
        context: this.context,
      })
      throw new UnauthorizedException('401 - Usuario no tiene permisos')
    }

    if (!bcrypt.compareSync(password, user.password)) {
      this.logger.error({
        message: `401 - Credenciales invalidas (passw) `,
        sendEmail: true,
        stack: UnauthorizedException.name,
        context: this.context,
      })

      throw new UnauthorizedException('Credenciales invalidas')
    }

    return {
      ...user,
      token: this.getJwtToken({ id: user.id }),
    }
  }

  async checkAuthStatus(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: { email: true, password: true, id: true, fullName: true },
    })

    return {
      ...user,
      token: this.getJwtToken({ id: user!.id }),
    }
  }

  async promote(userPromoteDto: PromoteUserDto): Promise<User> {
    const { email, roles } = userPromoteDto

    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
    })

    //chequeo que existe un usuario valido para email
    if (!user) {
      this.logger.error({
        message: `El usuario ${email} no existe`,
        sendEmail: false,
        stack: BadRequestException.name,
        context: this.context,
      })
      throw new BadRequestException(`El usuario ${email} no existe`)
    }

    //le asigno los roles tal cual llegaron (ya estan validados previamente)
    await this.userRepository.update(user.id, { roles })

    const userUpdated: User = {
      ...user,
      roles,
      checkFieldsBeforeInsert: function (): void {
        throw new Error('Function not implemented.')
      },
      checkFieldsBeforeUpdate: function (): void {
        throw new Error('Function not implemented.')
      },
    }
    return userUpdated
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload)
    return token
  }
}
