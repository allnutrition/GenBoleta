const ExcelJS = require('exceljs');
const logger = require('./logger');
const config = require('../config/config');

/**
 * Lee un archivo Excel y devuelve los datos como un array de objetos
 * @param {string} filePath - Ruta del archivo Excel
 * @param {string} sheetName - Nombre de la hoja (opcional)
 * @returns {Promise<Array>} - Array de objetos con los datos del Excel
 */
async function readExcelFile(filePath, sheetName = null) {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        
        // Usar la primera hoja si no se especifica una
        const worksheet = sheetName 
            ? workbook.getWorksheet(sheetName) 
            : workbook.worksheets[0];
        
        if (!worksheet) {
            throw new Error(`Hoja '${sheetName || "principal"}' no encontrada en el archivo Excel`);
        }
        
        // Obtener encabezados (primera fila)
        const headers = [];
        worksheet.getRow(1).eachCell((cell) => {
            headers.push(cell.value);
        });
        
        // Convertir filas a objetos usando los encabezados
        const data = [];
        worksheet.eachRow((row, rowNumber) => {
            // Omitir la fila de encabezados
            if (rowNumber > 1) {
                const rowData = {};
                row.eachCell((cell, colNumber) => {
                    if (colNumber <= headers.length) {
                        rowData[headers[colNumber - 1]] = cell.value;
                    }
                });
                data.push(rowData);
            }
        });
        
        logger.info(`Archivo Excel leído correctamente: ${filePath}`);
        return data;
    } catch (error) {
        logger.error(`Error al leer archivo Excel ${filePath}: ${error.message}`);
        throw error;
    }
}

/**
 * Busca un producto en el archivo Excel por su código de barras
 * @param {string} codigoBarras - Código de barras a buscar
 * @returns {Promise<Object|null>} - Datos del producto o null si no se encuentra
 */
async function buscarProductoPorCodigo(codigoBarras) {
    try {
        if (!codigoBarras) {
            logger.error("Código de barras vacío al buscar producto");
            return null;
        }
        
        const productos = await readExcelFile(config.EXCEL_PRODUCTOS);
        
        // Convertir código de barras a string para comparación
        const producto = productos.find(p => 
            String(p.CodigoBarra) === String(codigoBarras)
        );
        
        if (producto) {
            logger.info(`Producto encontrado para código de barras ${codigoBarras}`);
            return {
                alu: String(producto.ALU || ""),
                precio: parseFloat(producto.Precio || 0),
                descripcion: String(producto.Descripcion || "")
            };
        } else {
            logger.warn(`No se encontró producto para código de barras ${codigoBarras}`);
            return null;
        }
    } catch (error) {
        logger.error(`Error al buscar producto por código ${codigoBarras}: ${error.message}`);
        throw error;
    }
}

module.exports = {
    readExcelFile,
    buscarProductoPorCodigo
};