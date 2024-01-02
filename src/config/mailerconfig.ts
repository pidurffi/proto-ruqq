import * as dotenv from 'dotenv'

import { ConfigMailDto } from '../common/dto/configmail.dto'

dotenv.config()
//console.log(__dirname + '/../' + process.env.MAILER_TEMPLATES_FOLDER);

export const mailerconfig: ConfigMailDto = {
  //si no viene poner ! al final
  host: process.env.MAILER_HOST!,
  port: +process.env.MAILER_PORT!,
  pool: process.env.MAILER_POOL == 'true',
  secure: process.env.MAILER_SECURE == 'true',
  requireTLS: process.env.MAILER_TLS == 'true',
  auth: {
    user: process.env.MAILER_USER!,
    pass: process.env.MAILER_PASSWORD!,
  },
  from: process.env.MAILER_FROM,
}
