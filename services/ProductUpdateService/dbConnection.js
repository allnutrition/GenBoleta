const sql = require('mssql');
const config = require('./config');
const logger = require('./logger');

async function getProducts() {
    let pool;
    try {
        logger.info('Conectando a la base de datos SQL Server...');
        pool = await sql.connect(config.database);
        
        logger.info('Ejecutando consulta de productos...');
        const result = await pool.request().query(config.query);
        
        logger.info(`Consulta completada. Se obtuvieron ${result.recordset.length} productos.`);
        
        return result.recordset;
    } catch (err) {
        logger.error('Error en la conexión o consulta:', err);
        throw err;
    } finally {
        if (pool) {
            try {
                await pool.close();
                logger.info('Conexión a la base de datos cerrada.');
            } catch (err) {
                logger.error('Error al cerrar la conexión:', err);
            }
        }
    }
}

// Exportar las funciones
module.exports = {
    getProducts
};