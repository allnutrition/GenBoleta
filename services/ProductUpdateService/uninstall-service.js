const { uninstall } = require('./service');
const logger = require('./logger');

logger.info('Iniciando desinstalación del servicio de Windows...');

uninstall()
    .then(success => {
        if (success) {
            logger.info('Servicio desinstalado correctamente.');
        } else {
            logger.warn('El servicio ya estaba desinstalado o no existía.');
        }
    })
    .catch(err => {
        logger.error(`Error al desinstalar el servicio: ${err.message}`);
    });