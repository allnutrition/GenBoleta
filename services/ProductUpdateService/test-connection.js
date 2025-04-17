/**
 * Script para probar la conexión a SQL Server y la generación del archivo Excel
 * Este script es una prueba rápida sin necesidad de instalar el servicio
 */

const { getProductsData } = require('./dbConnection');
const { updateProductsExcel } = require('./excelManager');
const logger = require('./logger');

// Función principal de prueba
async function testConnection() {
    try {
        logger.info('=== INICIANDO PRUEBA DE CONEXIÓN Y ACTUALIZACIÓN ===');
        
        // 1. Probar la conexión a SQL Server y obtener datos
        logger.info('Probando conexión a SQL Server y obteniendo datos...');
        const products = await getProductsData();
        logger.info(`Conexión exitosa! Se encontraron ${products.length} productos.`);
        
        if (products.length > 0) {
            logger.info('Primera fila de ejemplo:');
            console.log(products[0]);
        }
        
        // 2. Probar la generación del archivo Excel
        logger.info('Generando archivo Excel...');
        await updateProductsExcel(products);
        
        logger.info('=== PRUEBA COMPLETADA EXITOSAMENTE ===');
        logger.info('Por favor verifica el archivo Excel generado en:');
        const config = require('./config');
        console.log(config.excelPath);
        
    } catch (error) {
        logger.error(`Error durante la prueba: ${error.message}`);
        console.error(error);
    }
}

// Ejecutar la prueba
testConnection();