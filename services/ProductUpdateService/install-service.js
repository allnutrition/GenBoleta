const { install } = require('./service');
const logger = require('./logger');

logger.info('Iniciando instalación del servicio de Windows...');

install()
    .then(success => {
        if (success) {
            logger.info('Servicio instalado correctamente.');
        } else {
            logger.warn('El servicio ya estaba instalado.');
        }
    })
    .catch(err => {
        logger.error(`Error al instalar el servicio: ${err.message}`);
    });