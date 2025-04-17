const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const server = require('./server');
const logger = require('./utils/logger');

// Manejar la creación/eliminación de la ventana principal de la aplicación
let mainWindow;

function createWindow() {
  // Crear la ventana del navegador
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'public/images/All.ico')
  });

  // Cargar la URL del servidor Express
  mainWindow.loadURL('http://localhost:1000');

  // Ocultar el menú en producción
  if (app.isPackaged) {
    mainWindow.setMenu(null);
  } else {
    // Abrir DevTools en desarrollo
    mainWindow.webContents.openDevTools();
  }

  // Cuando la ventana se cierre, solo la ocultamos (no cerramos la app)
  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });
}

// Este método se llamará cuando Electron haya terminado
// la inicialización y esté listo para crear ventanas del navegador.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // En macOS es común volver a crear una ventana en la aplicación cuando
    // se hace clic en el icono del dock y no hay otras ventanas abiertas.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Evitar que la aplicación se cierre cuando todas las ventanas estén cerradas
app.on('window-all-closed', function (e) {
  e.preventDefault();
});

// Cuando se reciba la señal para salir, cerrar correctamente
app.on('before-quit', () => {
  logger.info('Cerrando aplicación...');
});