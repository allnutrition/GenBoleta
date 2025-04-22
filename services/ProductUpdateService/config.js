const path = require('path');

module.exports = {
    // Configuración de la base de datos SQL Server
    database: {
        server: '192.168.100.7',
        user: 'UserApp',
        password: '$AppDB123.',
        database: 'ALLNUTRITION',
        options: {
            encrypt: false, // Cambiar a true si se requiere conexión segura
            trustServerCertificate: true,
            enableArithAbort: true,
        }
    },
    
    // Consulta SQL para obtener los productos
    query: `SELECT
        OITM.ItemCode AS ALU,
        OITM.ItemName AS Descripcion,
        OITM.CodeBars AS CodigoBarra,
        CAST(CAST(ITM1.Price AS INT) AS VARCHAR) AS Precio
    FROM
        ALLNUTRITION.DBO.OITM
    INNER JOIN
        ITM1 ON OITM.ItemCode = ITM1.ItemCode
    WHERE
        ITM1.PriceList = 1`,
    
    // Ruta al archivo Excel de productos
    excelPath: path.join(__dirname, '..', '..', 'data', 'productos.xlsx'),
    
    // Configuración del programador
    schedule: {
        // Modo de programación: 'fixed' para horarios específicos, 'interval' para intervalo de horas
        mode: 'interval',
        
        // Configuración para horarios fijos (cuando mode = 'fixed')
        fixedTimes: {
            morning: '0 8 * * *',    // 8:00 AM (formato cron)
            afternoon: '0 15 * * *'   // 3:00 PM (formato cron)
        },
        
        // Configuración para intervalo (cuando mode = 'interval')
        interval: {
            hours: 7,                 // Ejecutar cada 7 horas
            retryDelayHours: 2       // En caso de error, reintentar en 2 horas
        }
    },
    
    // Nombre del servicio de Windows
    serviceName: 'ProductUpdateService',
    serviceDisplayName: 'Servicio de Actualización de Productos',
    serviceDescription: 'Actualiza el archivo Excel de productos desde SQL Server automáticamente',
    
    // Configuración de logs
    logPath: path.join(__dirname, 'logs')
};