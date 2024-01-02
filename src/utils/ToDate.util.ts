/* eslint-disable @typescript-eslint/no-explicit-any */
import { BadRequestException } from '@nestjs/common'
import { Transform } from 'class-transformer'

import { DateUtils } from './Date.util'

const ToDate = () => {
  const toPlain = Transform(
    ({ value }) => {
      if (!DateUtils.validateUTCFormat(new Date(value).toISOString()))
        throw new BadRequestException('Invalid date format: must be ISO8601 format')
      return new Date(value)
    },
    {
      toPlainOnly: true,
    },
  )
  const toClass = (target: any, key: string) => {
    return Transform(
      ({ obj }) => {
        if (!DateUtils.validateUTCFormat(obj[key]))
          throw new BadRequestException('Invalid date format: must be ISO8601 format')
        return new Date(obj[key])
      },
      {
        toClassOnly: true,
      },
    )(target, key)
  }
  return function (target: any, key: string) {
    toPlain(target, key)
    toClass(target, key)
  }
}

export { ToDate }
