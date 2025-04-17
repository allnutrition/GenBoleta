const path = require('path');
const open = require('open');

// Cambiar el directorio de trabajo al directorio del script
process.chdir(path.resolve(__dirname));

// Configurar proceso para cerrar correctamente
process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err);
  // Continuar ejecutando - no salir en caso de error
});

// Cargar dependencias
const app = require('./app');
const logger = require('./utils/logger');
const tray = require('./tray');

// Puerto en el que se ejecutará la aplicación
const PORT = 1000;

// Iniciar el servidor
app.listen(PORT, () => {
  logger.info(`Servidor iniciado en http://localhost:${PORT}`);
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  
  // Abrir el navegador automáticamente
  setTimeout(() => {
    open(`http://localhost:${PORT}`).catch(err => {
      logger.error(`Error al abrir el navegador: ${err.message}`);
    });
  }, 1000);
});

// Inicializar la bandeja del sistema
try {
  tray.ready().then(() => {
    logger.info('Bandeja del sistema configurada correctamente.');
  }).catch((error) => {
    logger.error(`Error al configurar la bandeja del sistema: ${error.message}`);
  });
} catch (error) {
  logger.error(`Error inesperado al inicializar la bandeja del sistema: ${error.message}`);
}

// Manejar la salida del proceso
process.on('SIGINT', () => {
  logger.info('Cerrando servidor...');
  try {
    tray.kill(false);
  } catch (e) {
    logger.error(`Error al cerrar la bandeja: ${e.message}`);
  }
  process.exit();
});