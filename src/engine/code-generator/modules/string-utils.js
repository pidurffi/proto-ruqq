/* eslint-disable no-console */
const upperCamelCaseLib = require('uppercamelcase');
const camelizeLib = require('camelize');

// Original replaceAll function
const replaceAll = (string, search, replace) => {
  if (typeof string !== 'string') {
    // console.warn(`replaceAll: expected string as first argument, got ${typeof string}`);
    return string;
  }
  return string.split(search).join(replace);
};

// Wrapper for uppercamelcase
const toUpperCamelCase = (str) => {
  return upperCamelCaseLib(str);
};

// Wrapper for camelize
// Esta función debe convertir 'foo-bar-baz' a 'fooBarBaz'
const toCamelCase = (str) => {
  if (typeof str !== 'string') return str;
  // La librería camelize ya maneja los guiones correctamente.
  return camelizeLib(str);
};

// Genera las variaciones de nombres comunmente usadas.
const generateNameVariations = (engineName) => {
  const original = engineName;
  const lowerCase = original.toLowerCase();
  const upperCamel = toUpperCamelCase(original); // MyTestJules, TestJules
  // Para camelCase, es importante asegurarse que los guiones se procesen.
  // ej: "test-jules" debe ser "testJules"
  const camelCase = toCamelCase(original); // testJules

  // Para nombres de variables seguros donde 'original' podría tener caracteres no válidos (como '-')
  // Usaremos la versión camelCase.
  const variableSafeName = camelCase;
  const classNameBase = upperCamel; // Para nombres de clases: TestJules

  return {
    original: original, // test-jules
    camelCase: camelCase, // testJules
    upperCamelCase: upperCamel, // TestJules (si es una sola palabra) o MyTestJules (si uppercamelcase lo hace así)
                                // uppercamelcase('test-jules') -> TestJules
    lowerCase: lowerCase, // test-jules
    // para 'test-jules', uppercamelcase es 'TestJules'.
    // 'TestJules'.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '') -> TEST_JULES
    upperSnakeCase: classNameBase.replace(/([A-Z0-9])/g, '_$1').toUpperCase().replace(/^_/, ''), // TEST_JULES_REPOSITORY

    // Nombres especificos para identificadores que deben ser seguros:
    entityVariableName: variableSafeName, // testJules
    dtoQueryVariableName: `${variableSafeName}QueryDto`, // testJulesQueryDto
    dtoCreateVariableName: `${variableSafeName}CreateDto`, // testJulesCreateDto
    dtoUpdateVariableName: `${variableSafeName}UpdateDto`, // testJulesUpdateDto
    serviceClassName: `${classNameBase}Service`, // TestJulesService
    controllerClassName: `${classNameBase}Controller`, // TestJulesController
    entityClassName: classNameBase, // TestJules
  };
};

// Esta función podría ya no ser tan necesaria si generateNameVariations es suficientemente completo
// o si los reemplazos en template-processor se hacen más especificos.
const getSpecificControllerNames = (engineName) => {
  const baseCamelCase = toCamelCase(engineName); // Asegura que test-jules -> testJules
  return {
    all: `${baseCamelCase}All`,
    one: `${baseCamelCase}One`,
    create: `${baseCamelCase}Create`,
    remove: `${baseCamelCase}Remove`,
    update: `${baseCamelCase}Update`,
  };
};

// Test log
// const testName = "test-jules";
// console.log(`Variations for "${testName}":`, generateNameVariations(testName));
// const testName2 = "TestSingle";
// console.log(`Variations for "${testName2}":`, generateNameVariations(testName2));


module.exports = {
  replaceAll,
  toUpperCamelCase,
  toCamelCase,
  generateNameVariations,
  getSpecificControllerNames
};
