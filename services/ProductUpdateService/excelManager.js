const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const config = require('./config');
const logger = require('./logger');

/**
 * Crea o actualiza el archivo Excel de productos con los datos proporcionados
 * @param {Array} productsData - Datos de productos obtenidos de la DB
 * @returns {Promise<void>}
 */
async function updateProductsExcel(productsData) {
    try {
        logger.info(`Iniciando actualización del archivo Excel en: ${config.excelPath}`);
        
        // Crear el directorio si no existe
        const excelDir = path.dirname(config.excelPath);
        if (!fs.existsSync(excelDir)) {
            fs.mkdirSync(excelDir, { recursive: true });
            logger.info(`Directorio creado: ${excelDir}`);
        }
        
        // Crear un nuevo libro de Excel
        const workbook = new ExcelJS.Workbook();
        
        // Comprobar si el archivo ya existe
        let existingFile = false;
        try {
            if (fs.existsSync(config.excelPath)) {
                await workbook.xlsx.readFile(config.excelPath);
                existingFile = true;
                logger.info('Archivo Excel existente encontrado y cargado.');
            }
        } catch (err) {
            logger.warn(`No se pudo leer el archivo existente, se creará uno nuevo: ${err.message}`);
        }
        
        // Obtener o crear la hoja de productos
        let productsSheet;
        if (existingFile && workbook.getWorksheet('Productos')) {
            productsSheet = workbook.getWorksheet('Productos');
            productsSheet.clearRows(); // Limpiar datos anteriores
        } else {
            productsSheet = workbook.addWorksheet('Productos');
        }
        
        // Configurar cabeceras de columnas
        productsSheet.columns = [
            { header: 'ALU', key: 'ALU', width: 15 },
            { header: 'Descripcion', key: 'Descripcion', width: 40 },
            { header: 'CodigoBarra', key: 'CodigoBarra', width: 20 },
            { header: 'Precio', key: 'Precio', width: 15 }
        ];
        
        // Dar formato a las cabeceras
        const headerRow = productsSheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.height = 20;
        
        // Agregar datos
        productsSheet.addRows(productsData);
        
        // Obtener o crear la hoja de última actualización
        let updateSheet;
        if (existingFile && workbook.getWorksheet('UltimaAct')) {
            updateSheet = workbook.getWorksheet('UltimaAct');
            updateSheet.clearRows(); // Limpiar datos anteriores
        } else {
            updateSheet = workbook.addWorksheet('UltimaAct');
        }
        
        // Configurar columna de última actualización
        updateSheet.columns = [
            { header: 'Fecha y Hora', key: 'fechaHora', width: 25 }
        ];
        
        // Formatear cabecera
        const updateHeaderRow = updateSheet.getRow(1);
        updateHeaderRow.font = { bold: true };
        updateHeaderRow.height = 20;
        
        // Agregar la fecha y hora actual
        const now = new Date();
        updateSheet.addRow({
            fechaHora: now.toLocaleString('es-ES')
        });
        
        // Guardar el archivo
        await workbook.xlsx.writeFile(config.excelPath);
        logger.info(`Archivo Excel actualizado correctamente con ${productsData.length} productos.`);
    } catch (err) {
        logger.error(`Error al actualizar el archivo Excel: ${err.message}`);
        throw err;
    }
}

module.exports = { updateProductsExcel };