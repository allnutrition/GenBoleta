const Service = require('node-windows').Service;
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

// Ruta al script que ejecutará el servicio
const scriptPath = path.join(__dirname, 'index.js');

// Configurar el servicio
const svc = new Service({
    name: 'ActualizadorProductosGenBoleta',
    description: 'Servicio de actualización automática de productos para GenBoleta',
    script: scriptPath,
    wait: 2,
    grow: .5,
    maxRestarts: 3,
    env: [{
        name: "NODE_ENV",
        value: "production"
    }]
});

async function installService() {
    try {
        // Limpiar directorio daemon si existe
        const daemonDir = path.join(__dirname, 'daemon');
        if (fs.existsSync(daemonDir)) {
            logger.info('Limpiando instalación anterior...');
            fs.rmSync(daemonDir, { recursive: true, force: true });
        }

        // Desinstalar servicio existente si es necesario
        if (svc.exists) {
            logger.info('Desinstalando versión anterior del servicio...');
            await new Promise((resolve) => {
                svc.uninstall();
                svc.on('uninstall', () => {
                    setTimeout(resolve, 2000);
                });
            });
        }

        // Instalar el nuevo servicio
        logger.info('Instalando el servicio...');
        await new Promise((resolve, reject) => {
            svc.install();
            
            svc.on('install', () => {
                logger.info('Servicio instalado. Iniciando...');
                svc.start();
            });

            svc.on('start', () => {
                logger.info('Servicio iniciado correctamente.');
                resolve();
            });

            svc.on('error', (err) => {
                logger.error('Error en el servicio:', err);
                reject(err);
            });
        });

        logger.info('Instalación completada con éxito.');
        process.exit(0);
    } catch (err) {
        logger.error('Error durante la instalación:', err);
        process.exit(1);
    }
}

// Ejecutar la instalación
installService();