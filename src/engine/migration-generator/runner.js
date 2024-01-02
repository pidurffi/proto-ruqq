/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-vars */

const fs = require('fs-extra')
const upperCamelCase = require('uppercamelcase')
const camelize = require('camelize')

const replaceAll = (string, search, replace) => {
  return string.split(search).join(replace)
}

//Copy file
const copyFile = migrationFile => {
  console.log(`${__dirname}`)
  const migrationTemplate = `${__dirname}/template.ts`

  console.log(migrationFile)
  console.log(migrationTemplate)

  fs.copySync(migrationTemplate, migrationFile, { overwrite: false }, err => {
    if (err) throw err
    console.log('source.txt was copied to destination.txt')
  })
}

//Change repository file name and contents
const makeUpFile = async (fileName, name, timeSt) => {
  fs.readFile(fileName, 'utf8', function (err, data) {
    if (err) {
      return console.log(err)
    }
    const className = upperCamelCase(`${name}-${timeSt}`)
    let fileStr = replaceAll(data, 'Template', className)

    fs.writeFile(fileName, fileStr, 'utf8', function (err) {
      if (err) return console.log(err)
    })
  })
}

const parameters = process.argv.slice(2)
const name = parameters.length ? parameters[0] : 'migration'
const ahora = new Date()
const timeSt = ahora.getTime()
const isWindows = process.platform === 'win32'

const destFile = isWindows
  ? `${__dirname}\\..\\migrations\\${timeSt}-${name}.ts`
  : `${__dirname}/../migrations/${timeSt}-${name}.ts`
copyFile(destFile)
makeUpFile(destFile, name, timeSt)
