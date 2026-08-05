/**
 * Configuración de Jest para tests unitarios.
 *
 * Los tests conviven con el código que prueban (`*.spec.ts` junto al fuente).
 * Los tests end-to-end viven en test/ y usan test/jest-e2e.json.
 *
 * El tsconfig del proyecto usa `module: NodeNext`, que Jest no puede ejecutar
 * directamente: por eso el transform lo sobreescribe a commonjs. Los decoradores
 * y su metadata siguen habilitados, que es lo que necesita NestJS.
 */

/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: 'src/.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node',
          esModuleInterop: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          target: 'es2021',
        },
      },
    ],
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/engine/code-generator/**'],
  coverageDirectory: 'coverage',
}
