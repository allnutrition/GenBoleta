/**
 * Servicio de Actualización de Productos
 * 
 * Este servicio se encarga de actualizar el archivo Excel de productos
 * con datos obtenidos desde una base de datos SQL Server.
 */

const scheduler = require('./scheduler');
const logger = require('./logger');

// Si se ejecuta como servicio de Windows
if (process.env.NODE_ENV === 'service') {
    // Iniciar el programador de tareas
    scheduler.start()
        .then(success => {
            if (success) {
                logger.info('Servicio de actualización de productos iniciado correctamente.');
            } else {
                logger.error('No se pudo iniciar el servicio correctamente.');
            }
        })
        .catch(err => {
            logger.error(`Error al iniciar el servicio: ${err.message}`);
        });
} 
// Si se ejecuta desde línea de comandos para pruebas
else {
    const command = process.argv[2] || 'update';
    
    switch (command.toLowerCase()) {
        case 'update':
            // Ejecutar una actualización inmediata (para pruebas)
            logger.info('Ejecutando actualización manual...');
            scheduler.updateProcess()
                .then(() => {
                    logger.info('Actualización manual completada.');
                    process.exit(0);
                })
                .catch(err => {
                    logger.error(`Error en actualización manual: ${err.message}`);
                    process.exit(1);
                });
            break;
            
        default:
            logger.error(`Comando desconocido: ${command}`);
            console.log('Uso: node index.js [update]');
            process.exit(1);
    }
}

// Manejar el cierre apropiado del proceso
process.on('SIGINT', () => {
    logger.info('Señal SIGINT recibida. Cerrando servicio...');
    scheduler.stop();
    setTimeout(() => {
        logger.info('Servicio cerrado.');
        process.exit(0);
    }, 1000);
});

process.on('SIGTERM', () => {
    logger.info('Señal SIGTERM recibida. Cerrando servicio...');
    scheduler.stop();
    setTimeout(() => {
        logger.info('Servicio cerrado.');
        process.exit(0);
    }, 1000);
});