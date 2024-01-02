<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <h1 align="center">Proyecto OilProd</h1>

## Descripción

<!-- Agregar texto de la descripcion -->

Proyecto de control de producción de petróleo

## Instalación de la aplicación para desarrollo

```bash
$ npm install

# Si no instala o da errores:
$ npm update
```

```bash
$ yarn install
```

## Crear la base de datos en Docker

```bash
$ docker-compose up -d
```

## Ejecutar la aplicación

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Module AutoGeneration

NOMBRE-MODULO por ejemplo puede ser prueba-modulo (siempre usar guion y minusculas)

```bash
$ yarn create-engine NOMBRE-MODULO
```

```bash
$ npm run create-engine NOMBRE-MODULO
```

## Migrations

```bash
$ yarn db:migration:generate src/engine/migrations/NOMBRE-MIGRATION
$ yarn db:migrate
```

El primero crea la migration
El segudo la ejecuta

para crear un migration vacio

```bash
$ yarn db:createEmpty NOMBRE-MIGRATION
$ npm run db:createEmpty NOMBRE-MIGRATION
```

Donde NOMBRE-MIGRATION es solo un nombre descriptivo

Más cambios

```

```
