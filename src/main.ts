import { NestFactory } from '@nestjs/core'
import { ConsoleLogger, ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger('boostrap'),
  })

  const whiteList: string[] | undefined = process.env.CORS_WHITE_LIST?.split(',')

  let corsOptions = {}

  if (whiteList?.length) {
    corsOptions = {
      origin: whiteList,
      allowedHeaders:
        'access-control-allow-origin, Origin, X-Api-Key, X-Requested-With, Content-Type, Accept, Authorization',
      methods: ['OPTIONS', 'GET', 'PUT', 'POST', 'PATCH', 'DELETE'],
      credentials: true,
      preflightContinue: false,
    }
  }

  app.enableCors(corsOptions)

  const logger = new ConsoleLogger('bootstrap')

  app.setGlobalPrefix('api')

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )

  const config = new DocumentBuilder()
    .setTitle('Amuillán RESTFul API')
    .setDescription('Amuillán endpoints')
    .setVersion('1.0')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)

  /* eslint-disable @typescript-eslint/no-explicit-any */
  //app.use((req: any, res: any, next: any) => {
  //  res.header('Access-Control-Allow-Origin', '*')
  //  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE')
  //  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept')
  //  next()
  //})

  await app.listen(process.env.PORT!)
  logger.log(`App running on port ${process.env.PORT}  / use ${process.env.HOST_API}`)
}
bootstrap()
