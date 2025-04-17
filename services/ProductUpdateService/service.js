const path = require('path');
const { Service } = require('node-windows');
const config = require('./config');
const logger = require('./logger');

// Ruta absoluta al script principal
const scriptPath = path.join(__dirname, 'index.js');

// Crear una nueva instancia del servicio
const svc = new Service({
    name: config.serviceName,
    description: config.serviceDescription,
    script: scriptPath,
    nodeOptions: [],
    //// Uncomment these for troubleshooting
    // workingDirectory: path.dirname(scriptPath),
    // allowServiceLogon: true,
});

/**
 * Instala el servicio de Windows
 * @returns {Promise} Promesa que se resuelve cuando el servicio ha sido instalado
 */
function install() {
    return new Promise((resolve, reject) => {
        try {
            logger.info(`Instalando servicio Windows: ${config.serviceName}`);
            
            // Eventos de instalación
            svc.on('install', () => {
                logger.info('Servicio instalado correctamente.');
                // Iniciar el servicio después de instalarlo
                svc.start();
                resolve(true);
            });
            
            svc.on('alreadyinstalled', () => {
                logger.warn('El servicio ya está instalado.');
                resolve(false);
            });
            
            svc.on('invalidinstallation', () => {
                logger.error('Instalación inválida.');
                reject(new Error('Instalación inválida'));
            });
            
            svc.on('error', (err) => {
                logger.error(`Error durante la instalación: ${err.message}`);
                reject(err);
            });
            
            // Iniciar proceso de instalación
            svc.install();
        } catch (err) {
            logger.error(`Error al instalar el servicio: ${err.message}`);
            reject(err);
        }
    });
}

/**
 * Desinstala el servicio de Windows
 * @returns {Promise} Promesa que se resuelve cuando el servicio ha sido desinstalado
 */
function uninstall() {
    return new Promise((resolve, reject) => {
        try {
            logger.info(`Desinstalando servicio Windows: ${config.serviceName}`);
            
            // Eventos de desinstalación
            svc.on('uninstall', () => {
                logger.info('Servicio desinstalado correctamente.');
                resolve(true);
            });
            
            svc.on('alreadyuninstalled', () => {
                logger.warn('El servicio ya está desinstalado o no existe.');
                resolve(false);
            });
            
            svc.on('error', (err) => {
                logger.error(`Error durante la desinstalación: ${err.message}`);
                reject(err);
            });
            
            // Iniciar proceso de desinstalación
            svc.uninstall();
        } catch (err) {
            logger.error(`Error al desinstalar el servicio: ${err.message}`);
            reject(err);
        }
    });
}

/**
 * Inicia el servicio de Windows
 */
function start() {
    logger.info('Iniciando el servicio...');
    svc.start();
}

/**
 * Detiene el servicio de Windows
 */
function stop() {
    logger.info('Deteniendo el servicio...');
    svc.stop();
}

/**
 * Reinicia el servicio de Windows
 */
function restart() {
    logger.info('Reiniciando el servicio...');
    svc.restart();
}

module.exports = { install, uninstall, start, stop, restart };