/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */

// Ya no se necesitan directamente aquí, se usan en los módulos.
// const upperCamelCase = require('uppercamelcase');
// const camelize = require('camelize');
// const fs = require('fs-extra'); // Se usa a través de file-system.js

// Importar los nuevos módulos
const fileSystem = require('./modules/file-system.js')
const stringUtils = require('./modules/string-utils.js')
const templateProcessor = require('./modules/template-processor.js')
const projectUpdater = require('./modules/project-updater.js')
const path = require('path') // Para construir rutas de forma más robusta

// Las constantes como imports, booleanPropertyDummy, etc., no se usan en la lógica refactorizada.
// Si fueran necesarias para alguna parte de la generación de contenido que no se haya movido,
// deberían moverse al módulo correspondiente (probablemente template-processor.js).
// Por ahora, se asume que toda la manipulación de plantillas está en template-processor.js.

const main = async () => {
  const parameters = process.argv.slice(2)
  const engineName = parameters[0]

  if (!engineName) {
    console.error('Error: No engine name provided.')
    console.log('Usage: node runner.js <EngineName>')
    process.exit(1)
  }

  console.log(`Starting code generation for engine: ${engineName}`)

  const isWindows = process.platform === 'win32'

  // Definir rutas de manera más centralizada
  // __dirname en un script ejecutado con node es el directorio del script actual (src/engine/code-generator)
  const baseDir = path.resolve(__dirname, '..', '..') // Resuelve a la raíz del proyecto src/
  const generatorDir = __dirname // Directorio actual del runner

  const templateSourceDir = path.join(generatorDir, 'template')
  // Asegurarse que destDir se calcula desde la raíz del proyecto o una ubicación esperada
  // El original era: `${__dirname}/../resources/${engine}`.replace('/code-generator', '')
  // Esto implica que resources está al mismo nivel que engine.
  // Si __dirname es /path/to/project/src/engine/code-generator
  // entonces __dirname/.. es /path/to/project/src/engine
  // y __dirname/../.. es /path/to/project/src
  // El replace de /code-generator era para quitarlo si se partía de otra base.
  // La nueva ruta debería ser: path.join(baseDir, 'resources', engineName)
  // Asumiendo que 'resources' está en 'src/resources'
  const destDir = path.join(baseDir, 'resources', engineName)

  // Rutas a archivos de proyecto
  // app.module.ts está en src/app.module.ts
  const appModulePath = path.join(baseDir, 'app.module.ts')

  // valid-modules.ts está en src/engine/auth/interfaces/valid-modules.ts

  // Si el modulo de auth funciona solo por roles, no se necesita valid-modules.ts
  // const validModulesPath = path.join(baseDir, 'engine', 'auth', 'interfaces', 'valid-modules.ts');

  console.log(`Template source directory: ${templateSourceDir}`)
  console.log(`Destination directory: ${destDir}`)
  console.log(`AppModule path: ${appModulePath}`)
  // console.log(`ValidModules path: ${validModulesPath}`);

  try {
    // 1. Copiar la carpeta de plantillas
    // La función copyFolder en file-system.js usa fs.copySync, por lo que no es async.
    // El path a template es `${__dirname}/template` que es `templateSourceDir`
    fileSystem.copyFolder(templateSourceDir, destDir)
    console.log('Template folder copied successfully.')

    // 2. Procesar todas las plantillas (renombrar archivos y modificar contenido)
    // processAllTemplates es async
    await templateProcessor.processAllTemplates(destDir, engineName, fileSystem, stringUtils)
    console.log('Templates processed successfully.')

    // 3. Actualizar AppModule
    // updateAppModule es async
    await projectUpdater.updateAppModule(engineName, appModulePath, fileSystem, stringUtils)
    console.log('AppModule updated successfully.')

    // 4. Actualizar ValidModules
    // updateValidModules es async
    // await projectUpdater.updateValidModules(engineName, validModulesPath, fileSystem, stringUtils);
    // console.log('ValidModules updated successfully.');

    console.log(`Code generation for engine "${engineName}" completed successfully!`)
  } catch (error) {
    console.error(`Error during code generation for engine "${engineName}":`, error)
    process.exit(1)
  }
}

// Ejecutar la función principal
main()
