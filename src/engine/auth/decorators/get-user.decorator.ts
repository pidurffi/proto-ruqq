import { ExecutionContext, InternalServerErrorException, createParamDecorator } from '@nestjs/common'

export const GetUser = createParamDecorator((data: string[], ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest()
  const user = req.user

  if (!user) {
    throw new InternalServerErrorException('User not found (request)')
  }

  if (!data) return user

  if (data.length === 1) return user[data[0]]

  const info = data
    .filter(property => {
      if (user[property]) return property
    })
    .map(property => {
      return user[property]
    })
  return info
})
