const sql = require('mssql');
const config = require('./config');
const logger = require('./logger');

/**
 * Establece una conexión a SQL Server y ejecuta la consulta configurada
 * @returns {Promise<Array>} - Datos de productos obtenidos de la base de datos
 */
async function getProductsData() {
    let pool;
    
    try {
        logger.info('Conectando a la base de datos SQL Server...');
        pool = await sql.connect(config.database);
        
        logger.info('Ejecutando consulta de productos...');
        const result = await pool.request().query(config.query);
        
        logger.info(`Consulta completada. Se obtuvieron ${result.recordset.length} productos.`);
        return result.recordset;
    } catch (err) {
        logger.error(`Error al obtener datos de productos: ${err.message}`);
        throw err;
    } finally {
        if (pool) {
            try {
                await pool.close();
                logger.info('Conexión a la base de datos cerrada.');
            } catch (err) {
                logger.error(`Error al cerrar la conexión: ${err.message}`);
            }
        }
    }
}

module.exports = { getProductsData };