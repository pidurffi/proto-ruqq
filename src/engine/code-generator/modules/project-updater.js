/* eslint-disable no-console */

// fsWrapper y stringUtils se pasarán como dependencias.

const updateAppModule = async (engineModule, appModulePath, fsWrapper, stringUtils) => {
  try {
    let data = await fsWrapper.readFileAsync(appModulePath);
    const names = stringUtils.generateNameVariations(engineModule);
    const moduleClassName = `${names.upperCamelCase}Module`;
    const importStatement = `import { ${moduleClassName} } from './resources/${names.original}/${names.original}.module';`;

    let fileStr = data;

    // Check if import already exists
    if (!fileStr.includes(importStatement)) {
      fileStr = stringUtils.replaceAll(
        fileStr,
        '//ImportTemplateModule',
        `${importStatement}\n//ImportTemplateModule`
      );
    }

    // Check if module is already in imports array
    // This regex looks for `ModuleClassName,` or `ModuleClassName\n` within the imports array
    const moduleInArrayRegex = new RegExp(`${moduleClassName}\\s*,|${moduleClassName}\\s*\\n`);
    if (!moduleInArrayRegex.test(fileStr.split('//TemplateModule')[0])) { // Only search before the template comment
      fileStr = stringUtils.replaceAll(
        fileStr,
        '//TemplateModule',
        `${moduleClassName},\n    //TemplateModule`
      );
    }

    if (fileStr !== data) {
      await fsWrapper.writeFileAsync(appModulePath, fileStr);
      console.log(`AppModule (${appModulePath}) updated successfully for ${engineModule}.`);
    } else {
      console.log(`AppModule (${appModulePath}) already up-to-date for ${engineModule}.`);
    }

  } catch (err) {
    console.error(`Error updating AppModule for ${engineModule}:`, err);
  }
};

const updateValidModules = async (engineModule, validModulesPath, fsWrapper, stringUtils) => {
  const names = stringUtils.generateNameVariations(engineModule);
  const baseEnumEntry = `${names.camelCase} = '${names.original}'`;

  try {
    let fileStr = await fsWrapper.readFileAsync(validModulesPath);

    // Check if the base enum entry already exists
    if (fileStr.includes(baseEnumEntry)) {
      console.log(`ValidModules (${validModulesPath}) already contains entries for ${engineModule}.`);
      return;
    }

    const endpoints = ['all', 'one', 'create', 'update', 'remove', ''];
    let newEntries = '';
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      // For UpperCamelCase in enum keys, ensure 'All' becomes 'All', not 'all'
      const endpointUpperCamel = endpoint ? endpoint.charAt(0).toUpperCase() + endpoint.slice(1) : '';
      const enumKey = endpoint === '' ? names.camelCase : `${names.camelCase}${endpointUpperCamel}`;
      const enumValue = endpoint === '' ? names.original : `${names.original}-${endpoint}`;

      newEntries += `  ${enumKey} = '${enumValue}',\n`;
    }

    fileStr = stringUtils.replaceAll(
      fileStr,
      '//TemplateValidModules',
      `${newEntries}  //TemplateValidModules`
    );

    await fsWrapper.writeFileAsync(validModulesPath, fileStr);
    console.log(`ValidModules (${validModulesPath}) updated successfully for ${engineModule}.`);
  } catch (err) {
    console.error(`Error updating ValidModules for ${engineModule}:`, err);
  }
};

module.exports = {
  updateAppModule,
  updateValidModules,
};
