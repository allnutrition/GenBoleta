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
    
    // Configuración del programador (dos veces al día)
    schedule: {
        morning: '0 8 * * *',    // 8:00 AM (formato cron)
        afternoon: '0 15 * * *'  // 3:00 PM (formato cron)
    },
    
    // Nombre del servicio de Windows
    serviceName: 'ProductUpdateService',
    serviceDisplayName: 'Servicio de Actualización de Productos',
    serviceDescription: 'Actualiza el archivo Excel de productos desde SQL Server automáticamente',
    
    // Configuración de logs
    logPath: path.join(__dirname, 'logs')
};