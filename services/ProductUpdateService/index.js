/**
 * Servicio de Actualización de Productos
 * 
 * Este servicio se encarga de actualizar el archivo Excel de productos
 * con datos obtenidos desde una base de datos SQL Server.
 */

const { startScheduler } = require('./scheduler');
const logger = require('./logger');

process.on('uncaughtException', (err) => {
    logger.error('Error no capturado:', err);
    // No terminamos el proceso, permitimos que continúe
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Promesa rechazada no manejada:', reason);
    // No terminamos el proceso, permitimos que continúe
});

// Mantener el proceso vivo
process.stdin.resume();

// Manejar señales de terminación
process.on('SIGTERM', () => {
    logger.info('Señal SIGTERM recibida. Cerrando servicio...');
    process.exit(0);
});

logger.info('Iniciando servicio de actualización de productos...');

// Iniciar el programador
startScheduler();

logger.info('Servicio iniciado y ejecutándose...');