const SysTray = require('systray2').default;
const path = require('path');
const open = require('open');
const notifier = require('node-notifier');
const fs = require('fs-extra');

// Importar logger con manejo de errores
let logger;
try {
    logger = require('./utils/logger');
} catch (error) {
    logger = { 
        info: console.log, 
        error: console.error,
        debug: console.log
    };
}

// Determinar directorio base de manera robusta
const BASE_DIR = path.resolve(__dirname);

// Buscar ícono en varias ubicaciones posibles
function findIcon() {
    const possiblePaths = [
        path.join(BASE_DIR, 'public', 'images', 'All.ico'),
        path.join(BASE_DIR, 'public', 'All.ico'),
        path.join(BASE_DIR, 'All.ico')
    ];
    
    for (const iconPath of possiblePaths) {
        if (fs.existsSync(iconPath)) {
            return iconPath;
        }
    }
    
    // Si no se encuentra, devolver null
    return null;
}

const iconPath = findIcon();

// Crear bandeja con manejo de errores
let systray;
try {
    systray = new SysTray({
        menu: {
            // Configuración del ícono
            icon: iconPath,
            title: 'GeneraBoleta',
            tooltip: 'GeneraBoleta corriendo..',
            items: [
                {
                    title: 'Mostrar Estado',
                    tooltip: 'Mostrar estado del servicio',
                    enabled: true,
                    click: () => {
                        showStatusNotification();
                    },
                },
                {
                    title: 'Abrir Generador',
                    tooltip: 'Abrir Generador de Boletas',
                    enabled: true,
                    click: () => {
                        open('http://localhost:1000');
                    },
                },
                {
                    title: 'Salir',
                    tooltip: 'Cerrar la aplicación',
                    enabled: true,
                    click: () => {
                        try {
                            systray.kill(false);
                        } catch (e) {
                            console.error("Error al cerrar la bandeja:", e);
                        }
                        process.exit(0);
                    },
                },
            ],
        },
        debug: false,
        copyDir: true,
    });
} catch (error) {
    console.error("Error al inicializar la bandeja del sistema:", error);
    // Crear una versión alternativa sin bandeja
    systray = {
        ready: () => Promise.resolve(),
        kill: () => {},
        onClick: () => {}
    };
}

// Función para mostrar una notificación de estado
function showStatusNotification() {
    try {
        notifier.notify({
            title: 'GeneraBoleta - Servicio',
            message: 'El servicio está ejecutándose correctamente',
            icon: iconPath,
            sound: false,
            wait: true
        });
        
        // Manejar clic en la notificación
        notifier.on('click', function() {
            open('http://localhost:1000');
        });
        
        logger.info('Notificación de estado mostrada');
    } catch (error) {
        console.error("Error al mostrar notificación:", error);
    }
}

// Manejar eventos de clic en los elementos del menú con manejo de errores
try {
    systray.onClick((action) => {
        if (action && action.item && action.item.click) {
            action.item.click();
        }
    });
} catch (error) {
    console.error("Error al configurar handler de click:", error);
}

// Exportar la bandeja para usarla en otros archivos
module.exports = systray;