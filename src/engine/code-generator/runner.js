/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-vars */

const fs = require('fs-extra')
const upperCamelCase = require('uppercamelcase')
const camelize = require('camelize')

const imports = `import { ApiProperty } from '@nestjs/swagger'
import { typeImport } from 'class-validator'
`

const booleanPropertyDummy = `@ApiProperty({
    description: 'Property dummyBoolean',
    type: Boolean,
  })
  @IsBoolean()
  @Column()
  dummyBoolean: boolean

  //propP@ram`

const stringPropertyDummy = `@ApiProperty({
    description: 'Property dummyString',
    type: String,
  })
  @IsString()
  @Column()
  dummyString: string

  //propP@ram`

const numberPropertyDummy = `@ApiProperty({
    description: 'Property dummyNumber',
    type: Number,
  })
  @IsNumber()
  @Column()
  dummyNumber: number

  //propP@ram`

const replaceAll = (string, search, replace) => {
  return string.split(search).join(replace)
}

/* const makeUpEntity = fileStr => {
  let entityFile = imports + fileStr

  entityFile = replaceAll(entityFile, `, typeImport`, '')
  entityFile = replaceAll(
    entityFile,
    `\n
  //propP@ram`,
    '',
  )
  entityFile = replaceAll(entityFile, `import { Entity } from 'typeorm'`, `import { Column, Entity } from 'typeorm'`)

  return entityFile
} */

//Copy folder
const copyFolder = engineFolder => {
  console.log(`${__dirname}`)
  const srcDir = `${__dirname}/template`

  console.log(srcDir)
  console.log(engineFolder)

  fs.copySync(srcDir, engineFolder, { overwrite: false }, err => {
    if (err) throw err
    console.log('source.txt was copied to destination.txt')
  })
}

//Change entity file name and contents
const makeUpController = (fileStr, engineName) => {
  response = replaceAll(fileStr, `@Controller('/template')`, `@Controller('/${engineName}')`)
  response = replaceAll(response, 'templateAll', `${camelize(engineName, false)}All`)
  response = replaceAll(response, 'templateOne', `${camelize(engineName, false)}One`)
  response = replaceAll(response, 'templateCreate', `${camelize(engineName, false)}Create`)
  response = replaceAll(response, 'templateRemove', `${camelize(engineName, false)}Remove`)
  response = replaceAll(response, 'templateUpdate', `${camelize(engineName, false)}Update`)
  response = replaceAll(response, 'template', `${camelize(engineName, false)}`)
  return response
}

const makeUpImports = (fileStr, engineName, type = '') => {
  let response = replaceAll(fileStr, 'entities/template', `entities/${engineName}.entity`)
  response = replaceAll(response, 'dto/template', `dto/${engineName}.dto`)
  response = replaceAll(response, 'services/template', `services/${engineName}.service`)
  response = replaceAll(response, 'controllers/template', `controllers/${engineName}.controller`)
  response = replaceAll(response, 'providers/template', `providers/${engineName}.providers`)
  response = replaceAll(response, 'repositories/template', `repositories/${engineName}.repository`)

  if (type === 'module') {
    response = replaceAll(response, '../../database', `../../engine/database`)
    response = replaceAll(response, '../../../common', `../../common`)
    response = replaceAll(response, '../../auth', `../../engine/auth`)
  } else {
    response = replaceAll(response, '../../../../common', `../../../common`)
    response = replaceAll(response, '../../../auth', `../../../engine/auth`)
    response = replaceAll(response, '../../../database', `../../../engine/database`)
  }
  return response
}

//Change repository file name and contents
const makeUpFile = async (engineName, typeFolder, type) => {
  let newName =
    type !== 'module' ? `${destDir}/${typeFolder}/${engineName}.${type}.ts` : `${destDir}/${engineName}.${type}.ts`

  if (type !== 'constants') {
    const actualName = type !== 'module' ? `${destDir}/${typeFolder}/template.ts` : `${destDir}/template.module.ts`
    await fs.rename(actualName, newName)
  } else {
    newName = `${destDir}/constants.ts`
  }

  fs.readFile(newName, 'utf8', function (err, data) {
    if (err) {
      return console.log(err)
    }
    const className = upperCamelCase(engineName)
    let fileStr = replaceAll(data, 'Template', className)
    fileStr = replaceAll(fileStr, 'TEMPLATE_REPOSITORY', `${className.toUpperCase()}_REPOSITORY`)

    fileStr = makeUpImports(fileStr, engineName, type)

    /* if (type === 'entity') fileStr = makeUpEntity(fileStr)
    else */
    if (type === 'controller') fileStr = makeUpController(fileStr, engineName)

    fs.writeFile(newName, fileStr, 'utf8', function (err) {
      if (err) return console.log(err)
    })
  })
}

const addToAppModule = engineModule => {
  const appModuleFile = isWindows
    ? `${__dirname}\\..\\app.module.ts`.replace('\\code-generator', '')
    : `${__dirname}/../app.module.ts`.replace('/code-generator', '')
  fs.readFile(appModuleFile, 'utf8', function (err, data) {
    if (err) {
      return console.log(err)
    }
    const className = upperCamelCase(`${engineModule}Module`)
    let fileStr = replaceAll(data, '//TemplateModule', `${className},\n    //TemplateModule`)
    fileStr = replaceAll(
      fileStr,
      '//ImportTemplateModule',
      `import { ${className} } from './resources/${engineModule}/${engineModule}.module'\n//ImportTemplateModule`,
    )

    fs.writeFile(appModuleFile, fileStr, 'utf8', function (err) {
      if (err) return console.log(err)
    })
  })
}

const addEndpointToValidModule = (engineModule, endpoints) => {
  const validModuleFile = isWindows
    ? `${__dirname}\\auth\\interfaces\\valid-modules.ts`.replace('\\code-generator', '')
    : `${__dirname}/auth/interfaces/valid-modules.ts`.replace('/code-generator', '')

  fs.readFile(validModuleFile, 'utf8', function (err, data) {
    if (err) {
      return console.log(err)
    }
    let fileStr = data
    for (i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i]
      console.log(engineModule, endpoint)
      let className = camelize(`${engineModule}${upperCamelCase(endpoint)}`, false)
      fileStr = replaceAll(
        fileStr,
        `//TemplateValidModules`,
        `${className} = '${engineModule}${endpoint ? '-' + endpoint : endpoint}',\n${
          i == endpoints.length - 1 ? '\n' : ''
        }  //TemplateValidModules`,
      )
    }

    fs.writeFile(validModuleFile, fileStr, 'utf8', function (err) {
      if (err) return console.log(err)
    })
  })
}

const addToValidModule = async engineModule => {
  const endpoints = ['all', 'one', 'create', 'update', 'remove', '']

  addEndpointToValidModule(engineModule, endpoints)
}

const parameters = process.argv.slice(2)
const engine = parameters[0]

const isWindows = process.platform === 'win32'

const destDir = isWindows
  ? `${__dirname}\\..\\resources\\${engine}`.replace('\\code-generator', '')
  : `${__dirname}/../resources/${engine}`.replace('/code-generator', '')

copyFolder(destDir)
makeUpFile(engine, 'entities', 'entity')
makeUpFile(engine, 'repositories', 'repository')
makeUpFile(engine, 'dto', 'dto')
makeUpFile(engine, 'services', 'service')
makeUpFile(engine, 'controllers', 'controller')
makeUpFile(engine, 'providers', 'providers')
makeUpFile(engine, '', 'module')
makeUpFile(engine, '', 'constants')
addToAppModule(engine)
addToValidModule(engine)
