/* eslint-disable no-console */
const fs = require('fs-extra');
const util = require('util');

// Promisify fs functions
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const rename = util.promisify(fs.rename);
// fs.copySync no necesita promisify ya que es síncrona, pero la envolvemos para mantener consistencia si fuera necesario o por si cambia en el futuro.
// Sin embargo, para este caso, la dejaremos como la original ya que el script la usa de forma síncrona.

// Original copyFolder function from runner.js
const copyFolder = (srcDir, engineFolder) => {
  console.log(`Source directory: ${srcDir}`);
  console.log(`Destination directory: ${engineFolder}`);

  try {
    fs.copySync(srcDir, engineFolder, { overwrite: false });
    console.log('Folder copied successfully.');
  } catch (err) {
    console.error('Error copying folder:', err);
    throw err; // Re-throw to allow caller to handle
  }
};

const readFileAsync = async (filePath, encoding = 'utf8') => {
  try {
    return await readFile(filePath, encoding);
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    throw err;
  }
};

const writeFileAsync = async (filePath, data, encoding = 'utf8') => {
  try {
    await writeFile(filePath, data, encoding);
    console.log(`File ${filePath} written successfully.`);
  } catch (err) {
    console.error(`Error writing file ${filePath}:`, err);
    throw err;
  }
};

const renameFileAsync = async (oldPath, newPath) => {
  try {
    await rename(oldPath, newPath);
    console.log(`File ${oldPath} renamed to ${newPath} successfully.`);
  } catch (err) {
    console.error(`Error renaming file ${oldPath} to ${newPath}:`, err);
    throw err;
  }
};

module.exports = {
  copyFolder,
  readFileAsync,
  writeFileAsync,
  renameFileAsync,
  // Exponer fsExtra por si se necesita directamente, aunque es preferible usar los wrappers.
  fsExtra: fs
};
