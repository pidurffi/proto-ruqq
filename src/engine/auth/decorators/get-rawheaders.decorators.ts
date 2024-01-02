import { ExecutionContext, InternalServerErrorException, createParamDecorator } from '@nestjs/common'

export const GetRawHeaders = createParamDecorator((data, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest()
  const rawHeaders = req.rawHeaders

  if (!rawHeaders) {
    throw new InternalServerErrorException('rawHeaders not found (request)')
  }

  if (!data) return rawHeaders
})
