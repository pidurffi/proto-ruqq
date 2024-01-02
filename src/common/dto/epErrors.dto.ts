import { IsNumber, IsString } from 'class-validator'

export class EpResponseError {
  @IsNumber()
  statusCode: number

  @IsString()
  error: string

  @IsString()
  message: string
}

export class EpExceptionError {
  response: EpResponseError

  @IsNumber()
  status: number
}
