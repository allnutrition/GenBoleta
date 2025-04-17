const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Verifica si un directorio existe y lo crea si no existe
 * @param {string} dirPath - Ruta del directorio a verificar/crear
 */
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        try {
            fs.mkdirSync(dirPath, { recursive: true });
            logger.info(`Directorio creado: ${dirPath}`);
        } catch (error) {
            logger.error(`Error al crear directorio ${dirPath}: ${error.message}`);
            throw error;
        }
    }
}

/**
 * Guarda datos en un archivo JSON
 * @param {string} filePath - Ruta completa del archivo
 * @param {Object} data - Datos a guardar en formato JSON
 */
function saveJsonFile(filePath, data) {
    try {
        // Asegurar que el directorio existe
        ensureDirectoryExists(path.dirname(filePath));
        
        // Guardar el archivo JSON con formato legible
        fs.writeFileSync(
            filePath, 
            JSON.stringify(data, null, 4), 
            { encoding: 'utf8' }
        );
        
        logger.info(`Archivo JSON guardado: ${filePath}`);
        return true;
    } catch (error) {
        logger.error(`Error al guardar archivo JSON ${filePath}: ${error.message}`);
        throw error;
    }
}

/**
 * Lee un archivo JSON y devuelve su contenido
 * @param {string} filePath - Ruta completa del archivo
 * @returns {Object} - Contenido del archivo JSON parseado
 */
function readJsonFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            logger.error(`Archivo no encontrado: ${filePath}`);
            return null;
        }
        
        const data = fs.readFileSync(filePath, { encoding: 'utf8' });
        return JSON.parse(data);
    } catch (error) {
        logger.error(`Error al leer archivo JSON ${filePath}: ${error.message}`);
        throw error;
    }
}

/**
 * Guarda datos en un archivo de texto
 * @param {string} filePath - Ruta completa del archivo
 * @param {string} content - Contenido a guardar
 */
function saveTextFile(filePath, content) {
    try {
        // Asegurar que el directorio existe
        ensureDirectoryExists(path.dirname(filePath));
        
        // Guardar el archivo de texto
        fs.writeFileSync(filePath, content, { encoding: 'utf8' });
        
        logger.info(`Archivo de texto guardado: ${filePath}`);
        return true;
    } catch (error) {
        logger.error(`Error al guardar archivo de texto ${filePath}: ${error.message}`);
        throw error;
    }
}

/**
 * Lee un archivo de texto y devuelve su contenido
 * @param {string} filePath - Ruta completa del archivo
 * @returns {string} - Contenido del archivo de texto
 */
function readTextFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            logger.error(`Archivo no encontrado: ${filePath}`);
            return null;
        }
        
        return fs.readFileSync(filePath, { encoding: 'utf8' });
    } catch (error) {
        logger.error(`Error al leer archivo de texto ${filePath}: ${error.message}`);
        throw error;
    }
}

/**
 * Mueve un archivo de una ubicación a otra
 * @param {string} sourcePath - Ruta de origen
 * @param {string} destinationPath - Ruta de destino
 */
function moveFile(sourcePath, destinationPath) {
    try {
        // Asegurar que el directorio de destino existe
        ensureDirectoryExists(path.dirname(destinationPath));
        
        // Mover el archivo
        fs.renameSync(sourcePath, destinationPath);
        
        logger.info(`Archivo movido de ${sourcePath} a ${destinationPath}`);
        return true;
    } catch (error) {
        logger.error(`Error al mover archivo de ${sourcePath} a ${destinationPath}: ${error.message}`);
        throw error;
    }
}

/**
 * Obtiene una lista de archivos en un directorio con un filtro opcional
 * @param {string} dirPath - Ruta del directorio
 * @param {Function} filterFn - Función de filtro opcional (recibe nombre de archivo, devuelve booleano)
 * @returns {Array} - Lista de nombres de archivos
 */
function listFiles(dirPath, filterFn = null) {
    try {
        if (!fs.existsSync(dirPath)) {
            logger.error(`Directorio no encontrado: ${dirPath}`);
            return [];
        }
        
        let files = fs.readdirSync(dirPath);
        
        if (filterFn) {
            files = files.filter(filterFn);
        }
        
        return files;
    } catch (error) {
        logger.error(`Error al listar archivos en ${dirPath}: ${error.message}`);
        throw error;
    }
}

module.exports = {
    ensureDirectoryExists,
    saveJsonFile,
    readJsonFile,
    saveTextFile,
    readTextFile,
    moveFile,
    listFiles
};