const path = require('path');
const open = require('open');
const net = require('net');
const { exec } = require('child_process');

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

// Función para verificar si el puerto está en uso
function isPortInUse() {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(true))
      .once('listening', () => {
        tester.once('close', () => resolve(false));
        tester.close();
      })
      .listen(PORT);
  });
}

// Función para obtener y cerrar el proceso que usa el puerto
async function killProcessOnPort() {
  return new Promise((resolve, reject) => {
    const platform = process.platform;
    const cmd = platform === 'win32' 
      ? `netstat -ano | findstr :${PORT}` 
      : `lsof -i:${PORT} -t`;

    exec(cmd, (error, stdout, stderr) => {
      if (error || stderr) {
        logger.error(`Error al buscar proceso en puerto ${PORT}: ${error || stderr}`);
        reject(error || stderr);
        return;
      }

      // En Windows, necesitamos extraer el PID de la última columna
      const pid = platform === 'win32'
        ? stdout.split('\n')[0]?.trim()?.split(/\s+/)?.[4]
        : stdout.trim();

      if (!pid) {
        logger.error('No se encontró PID del proceso');
        reject(new Error('PID no encontrado'));
        return;
      }

      // Matar el proceso
      const killCmd = platform === 'win32' ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`;
      exec(killCmd, (error, stdout, stderr) => {
        if (error || stderr) {
          logger.error(`Error al matar proceso ${pid}: ${error || stderr}`);
          reject(error || stderr);
          return;
        }
        logger.info(`Proceso anterior cerrado (PID: ${pid})`);
        resolve();
      });
    });
  });
}

// Función principal de inicio
async function startServer() {
  try {
    // Verificar si el puerto está en uso
    const portInUse = await isPortInUse();
    
    if (portInUse) {
      logger.info(`Puerto ${PORT} en uso. Cerrando instancia anterior...`);
      await killProcessOnPort();
      // Esperar un momento para asegurar que el puerto se libere
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

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
      await tray.ready();
      logger.info('Bandeja del sistema configurada correctamente.');
    } catch (error) {
      logger.error(`Error al configurar la bandeja del sistema: ${error.message}`);
    }

  } catch (error) {
    logger.error(`Error al iniciar el servidor: ${error.message}`);
    process.exit(1);
  }
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

// Iniciar el servidor
startServer();