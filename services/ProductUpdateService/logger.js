const fs = require('fs');
const path = require('path');
const winston = require('winston');
const config = require('./config');

// Asegurarse de que el directorio de logs exista
if (!fs.existsSync(config.logPath)) {
    fs.mkdirSync(config.logPath, { recursive: true });
}

// Configuración del logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.printf(info => `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}`)
    ),
    transports: [
        // Escribir todos los logs en el archivo
        new winston.transports.File({ 
            filename: path.join(config.logPath, 'product-update-service.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Escribir los logs de error en un archivo separado
        new winston.transports.File({ 
            filename: path.join(config.logPath, 'product-update-service-error.log'),
            level: 'error'
        }),
        // Mostrar logs en la consola durante el desarrollo
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
            )
        })
    ]
});

module.exports = logger;