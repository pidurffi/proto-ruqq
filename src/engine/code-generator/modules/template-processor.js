/* eslint-disable no-console */

// Función para modificar el contenido de los controladores
const makeUpControllerInternal = (fileStr, engineName, stringUtils) => {
  // Usar las variaciones generadas por stringUtils
  const names = stringUtils.generateNameVariations(engineName);
  // getSpecificControllerNames usa toCamelCase, lo cual es correcto para nombres de método base
  const controllerMethodNames = stringUtils.getSpecificControllerNames(engineName);

  let response = fileStr;

  // Reemplazar el endpoint principal del controlador
  response = stringUtils.replaceAll(response, `@Controller('/template')`, `@Controller('/${names.original}')`);

  // Reemplazar nombres de métodos (findAll, findOne, etc.)
  // Estos deberían usar la base camelCase del engineName.
  response = stringUtils.replaceAll(response, 'templateAll', controllerMethodNames.all);
  response = stringUtils.replaceAll(response, 'templateOne', controllerMethodNames.one);
  response = stringUtils.replaceAll(response, 'templateCreate', controllerMethodNames.create);
  response = stringUtils.replaceAll(response, 'templateRemove', controllerMethodNames.remove);
  response = stringUtils.replaceAll(response, 'templateUpdate', controllerMethodNames.update);

  // Reemplazar el nombre del parámetro DTO en findAll
  // Original: @Query() templateQueryDto: TemplateQueryDto
  // Debe ser: @Query() testJulesQueryDto: TestJulesQueryDto
  response = stringUtils.replaceAll(response, 'templateQueryDto: TemplateQueryDto', `${names.dtoQueryVariableName}: ${names.upperCamelCase}QueryDto`);

  // Reemplazar el nombre del parámetro DTO en create
  // Original: @Body() entity: TemplateCreateDto
  // Debe ser: @Body() entity: TestJulesCreateDto (el nombre 'entity' se mantiene, solo el tipo cambia)
  // Sin embargo, si 'entity' fuera también derivado, sería names.entityVariableName
  // El template original usa 'entity' como nombre fijo para el parámetro del body en create y update.
  // Solo necesitamos asegurar que el TIPO DTO sea correcto.
  response = stringUtils.replaceAll(response, 'entity: TemplateCreateDto', `entity: ${names.upperCamelCase}CreateDto`);

  // Reemplazar el nombre del parámetro DTO en update
  // Original: @Body() entity: TemplateUpdateDto
  // Debe ser: @Body() entity: TestJulesUpdateDto
  response = stringUtils.replaceAll(response, 'entity: TemplateUpdateDto', `entity: ${names.upperCamelCase}UpdateDto`);

  // Reemplazos generales para el nombre de la entidad en camelCase (para variables, servicios, etc.)
  // Esto debe hacerse con cuidado para no reemplazar incorrectamente.
  // Por ejemplo, si `engineName` es "TestUser", `names.camelCase` es "testUser".
  // Si `engineName` es "test-user", `names.camelCase` es "testUser".
  // El template usa 'templateService', 'TemplateService', 'Template'.
  response = stringUtils.replaceAll(response, 'TemplateService', `${names.serviceClassName}`);
  response = stringUtils.replaceAll(response, 'templateService', `${names.camelCase}Service`); // Si existiera una instancia así nombrada

  // Reemplazo general de 'template' por el nombre camelCase del engine.
  // Esto puede ser problemático si 'template' aparece en otros contextos.
  // Es mejor ser más específico. El runner original hacía esto:
  // response = replaceAll(response, 'template', `${camelize(engineName, false)}`)
  // Lo cual ahora es names.camelCase.
  // Considerar si este reemplazo general es seguro o si se necesitan reemplazos más específicos.
  // Por ahora, lo mantendremos como estaba en el runner.js original, usando names.camelCase.
  response = stringUtils.replaceAll(response, ' template', ` ${names.camelCase}`); // Espacio para evitar reemplazar 'templateS' o similar
  response = stringUtils.replaceAll(response, '(template', `(${names.camelCase}`);
  response = stringUtils.replaceAll(response, '.template', `.${names.camelCase}`);
  // Este es un reemplazo más riesgoso, pero estaba en el original.
  // Si 'template' es una palabra completa, se reemplaza.
  // Ejemplo: ValidModules.template -> ValidModules.testJules
  // Esto podría ser correcto para ValidModules.template, pero podría fallar en otros sitios.
  // Vamos a ser más específicos para los nombres de ValidModules si es necesario.
  // Por ahora, replicamos el comportamiento anterior que era un replaceAll('template', names.camelCase)
  // pero de forma un poco más segura para evitar subcadenas.
  // Un reemplazo global de 'template' es peligroso.
  // El original era: response = replaceAll(response, 'template', camelize(engineName, false))
  // Esto significa que cualquier instancia de la palabra "template" se convertía.
  // Ejemplo: `ValidModules.template` se convertía en `ValidModules.testJules`
  // Esto se maneja mejor en `makeUpImportsInternal` o siendo específico aquí.
  // Por ahora, dejaremos los reemplazos de servicio y DTOs arriba que son más específicos.
  // El `ValidModules.template` se maneja en `makeUpImportsInternal`.

  return response;
};

// Función para modificar las importaciones
const makeUpImportsInternal = (fileStr, engineName, type = '', stringUtils) => {
  const names = stringUtils.generateNameVariations(engineName);
  let response = fileStr;

  // Reemplazar 'template' en contextos de importación específicos
  response = stringUtils.replaceAll(response, 'entities/template', `entities/${names.original}.entity`);
  response = stringUtils.replaceAll(response, '../entities/template', `../entities/${names.original}.entity`);
  response = stringUtils.replaceAll(response, 'dto/template', `dto/${names.original}.dto`);
  response = stringUtils.replaceAll(response, '../dto', `../dto`); // Asegurar que no se rompa si ya está bien.

  response = stringUtils.replaceAll(response, './template-create.dto', `./${names.original}-create.dto`);
  response = stringUtils.replaceAll(response, './template-update.dto', `./${names.original}-update.dto`);
  response = stringUtils.replaceAll(response, './template-query.dto', `./${names.original}-query.dto`);
  response = stringUtils.replaceAll(response, './template-list.dto', `./${names.original}-list.dto`);

  response = stringUtils.replaceAll(response, 'services/template', `services/${names.original}.service`);
  response = stringUtils.replaceAll(response, '../services/template', `../services/${names.original}.service`);

  response = stringUtils.replaceAll(response, 'controllers/template', `controllers/${names.original}.controller`);
  // Importación de ValidModules en el controlador
  response = stringUtils.replaceAll(response, 'ValidModules.template', `ValidModules.${names.camelCase}`);
  response = stringUtils.replaceAll(response, 'ValidModules.templateAll', `ValidModules.${names.camelCase}All`);
  response = stringUtils.replaceAll(response, 'ValidModules.templateOne', `ValidModules.${names.camelCase}One`);
  response = stringUtils.replaceAll(response, 'ValidModules.templateCreate', `ValidModules.${names.camelCase}Create`);
  response = stringUtils.replaceAll(response, 'ValidModules.templateUpdate', `ValidModules.${names.camelCase}Update`);
  response = stringUtils.replaceAll(response, 'ValidModules.templateRemove', `ValidModules.${names.camelCase}Remove`);


  response = stringUtils.replaceAll(response, 'providers/template', `providers/${names.original}.providers`);
  response = stringUtils.replaceAll(response, 'repositories/template', `repositories/${names.original}.repository`);

  // Reemplazos de rutas genéricas (common, auth, database)
  if (type === 'module') {
    response = stringUtils.replaceAll(response, '../../database', `../../engine/database`);
    response = stringUtils.replaceAll(response, '../../../common', `../../common`);
    response = stringUtils.replaceAll(response, '../../auth', `../../engine/auth`);
  } else { // Para archivos en subcarpetas como controllers, services, dto, entities
    response = stringUtils.replaceAll(response, '../../../../common', `../../../common`);
    response = stringUtils.replaceAll(response, '../../../auth', `../../../engine/auth`);
    response = stringUtils.replaceAll(response, '../../../database', `../../../engine/database`);
  }
  return response;
};

const processDtoFile = async (dtoInfo, destDir, typeFolder, engineName, fsWrapper, stringUtils) => {
  const names = stringUtils.generateNameVariations(engineName);
  const actualName = `${destDir}/${typeFolder}/${dtoInfo.from}`;
  const newName = `${destDir}/${typeFolder}/${dtoInfo.to}`;

  try {
    await fsWrapper.renameFileAsync(actualName, newName);
    let data = await fsWrapper.readFileAsync(newName);
    let fileStr = stringUtils.replaceAll(data, dtoInfo.classFrom, dtoInfo.classTo);
    // Para nombres de clase DTO, siempre es UpperCamelCase
    fileStr = stringUtils.replaceAll(fileStr, 'TemplateCreateDto', `${names.upperCamelCase}CreateDto`);
    fileStr = stringUtils.replaceAll(fileStr, 'TemplateUpdateDto', `${names.upperCamelCase}UpdateDto`);
    fileStr = stringUtils.replaceAll(fileStr, 'TemplateQueryDto', `${names.upperCamelCase}QueryDto`);
    fileStr = stringUtils.replaceAll(fileStr, 'TemplateListDto', `${names.upperCamelCase}ListDto`);

    // Reemplazo general de 'Template' (clase) por el nombre de la entidad en UpperCamelCase
    fileStr = stringUtils.replaceAll(fileStr, ' Template', ` ${names.upperCamelCase}`); // ej. class Template -> class TestJules
    fileStr = stringUtils.replaceAll(fileStr, '(Template', `(${names.upperCamelCase}`);
    fileStr = stringUtils.replaceAll(fileStr, '<Template', `<${names.upperCamelCase}`);

    // Reemplazo de 'template' (nombre de archivo/ruta) por el original (puede tener guiones)
    // fileStr = stringUtils.replaceAll(fileStr, 'template', names.original); // CUIDADO: esto es muy general

    // Asegurar que las importaciones de entidad sean correctas
    fileStr = stringUtils.replaceAll(fileStr, `../entities/template.entity`, `../entities/${names.original}.entity`);
    // Reemplazos de importación generales después de los específicos
    fileStr = makeUpImportsInternal(fileStr, engineName, 'dto', stringUtils);

    await fsWrapper.writeFileAsync(newName, fileStr);
  } catch (err) {
    console.error(`Error processing DTO file ${dtoInfo.from}:`, err);
  }
};

const processDtoFiles = async (destDir, engineName, fsWrapper, stringUtils) => {
  const names = stringUtils.generateNameVariations(engineName);
  const typeFolder = 'dto';
  const dtoFilesInfo = [
    { from: 'template-create.dto.ts', to: `${names.original}-create.dto.ts`, classFrom: 'TemplateCreateDto', classTo: `${names.upperCamelCase}CreateDto` },
    { from: 'template-update.dto.ts', to: `${names.original}-update.dto.ts`, classFrom: 'TemplateUpdateDto', classTo: `${names.upperCamelCase}UpdateDto` },
    { from: 'template-query.dto.ts', to: `${names.original}-query.dto.ts`, classFrom: 'TemplateQueryDto', classTo: `${names.upperCamelCase}QueryDto` },
    { from: 'template-list.dto.ts', to: `${names.original}-list.dto.ts`, classFrom: 'TemplateListDto', classTo: `${names.upperCamelCase}ListDto` },
  ];

  const indexPath = `${destDir}/${typeFolder}/index.ts`;
  try {
    const newExports = dtoFilesInfo.map(file => `export * from './${file.to.replace('.ts', '')}';`).join('\n');
    await fsWrapper.writeFileAsync(indexPath, newExports + '\n');
  } catch (err) {
    console.error('Error updating dto/index.ts:', err);
  }

  for (const dtoInfo of dtoFilesInfo) {
    await processDtoFile(dtoInfo, destDir, typeFolder, engineName, fsWrapper, stringUtils);
  }
};

const processGenericFile = async (destDir, engineName, typeFolder, fileType, fsWrapper, stringUtils) => {
  const names = stringUtils.generateNameVariations(engineName);
  let newName;
  let actualName;

  if (fileType === 'module') {
    actualName = `${destDir}/template.module.ts`;
    newName = `${destDir}/${names.original}.module.ts`;
  } else if (fileType === 'constants') {
    actualName = `${destDir}/constants.ts`;
    newName = actualName;
  } else {
    actualName = `${destDir}/${typeFolder}/template.ts`;
    newName = `${destDir}/${typeFolder}/${names.original}.${fileType}.ts`;
  }

  try {
    if (fileType !== 'constants') {
        await fsWrapper.renameFileAsync(actualName, newName);
    }

    let fileStr = await fsWrapper.readFileAsync(newName);

    // Reemplazos generales de 'Template' (clase/tipo) y 'TEMPLATE_REPOSITORY' (constante)
    fileStr = stringUtils.replaceAll(fileStr, 'TemplateService', `${names.serviceClassName}`); // Para el service.ts
    fileStr = stringUtils.replaceAll(fileStr, 'TemplateController', `${names.controllerClassName}`); // Para el controller.ts
    fileStr = stringUtils.replaceAll(fileStr, 'TemplateRepository', `${names.upperCamelCase}Repository`); // Para el repository.ts
    fileStr = stringUtils.replaceAll(fileStr, 'TemplateEntity', `${names.entityClassName}`); // Para el entity.ts (si se usara así)
    fileStr = stringUtils.replaceAll(fileStr, 'TemplateModule', `${names.upperCamelCase}Module`); // Para el module.ts
    fileStr = stringUtils.replaceAll(fileStr, 'Template', names.upperCamelCase); // Reemplazo más genérico de clase/tipo
    fileStr = stringUtils.replaceAll(fileStr, 'TEMPLATE_REPOSITORY', `${names.upperSnakeCase}_REPOSITORY`);

    // Reemplazo de 'template' (nombre de archivo base en minúsculas o camelCase para variables)
    // El original en runner.js hacía un replaceAll('template', camelize(engineName))
    // Esto ahora es names.camelCase
    // Necesitamos ser cuidadosos para no reemplazar 'template' dentro de otras palabras.
    // Reemplazamos ' template' (con espacio antes) o 'template.' o '(template'
    // O cuando 'template' es una palabra completa usada como identificador (ej. en ValidModules.template).
    // Esta lógica ahora está más concentrada en makeUpImportsInternal y makeUpControllerInternal.
    // Aquí, el reemplazo de `template` por `names.camelCase` se hará si es necesario para nombres de variables específicos.
    // Por ahora, el reemplazo de 'Template' por `names.upperCamelCase` es el más importante para nombres de clase.
    // Y 'template' en rutas de importación se maneja en makeUpImportsInternal.

    fileStr = makeUpImportsInternal(fileStr, engineName, fileType, stringUtils);

    if (fileType === 'controller') {
      fileStr = makeUpControllerInternal(fileStr, engineName, stringUtils);
    }

    await fsWrapper.writeFileAsync(newName, fileStr);
  } catch (err) {
    console.error(`Error processing generic file ${actualName} for type ${fileType}:`, err);
  }
};

const processAllTemplates = async (destDir, engineName, fsWrapper, stringUtils) => {
  await processGenericFile(destDir, engineName, 'entities', 'entity', fsWrapper, stringUtils);
  await processGenericFile(destDir, engineName, 'repositories', 'repository', fsWrapper, stringUtils);
  await processDtoFiles(destDir, engineName, fsWrapper, stringUtils);
  await processGenericFile(destDir, engineName, 'services', 'service', fsWrapper, stringUtils);
  await processGenericFile(destDir, engineName, 'controllers', 'controller', fsWrapper, stringUtils);
  await processGenericFile(destDir, engineName, 'providers', 'providers', fsWrapper, stringUtils);
  await processGenericFile(destDir, engineName, '', 'module', fsWrapper, stringUtils);
  await processGenericFile(destDir, engineName, '', 'constants', fsWrapper, stringUtils);
};

module.exports = {
  processAllTemplates,
};
