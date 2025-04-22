const Excel = require('exceljs');
const { getProducts } = require('./dbConnection');
const config = require('./config');
const logger = require('./logger');
const fs = require('fs');
const path = require('path');

async function updateProducts() {
    try {
        logger.info('Iniciando proceso de actualización de productos...');
        
        // Obtener productos de la base de datos
        const products = await getProducts();
        logger.info(`Se obtuvieron ${products.length} productos.`);
        
        // Crear un nuevo workbook cada vez
        const workbook = new Excel.Workbook();
        
        // Crear una nueva hoja
        const worksheet = workbook.addWorksheet('Productos');
        
        // Configurar las columnas con nombres estandarizados
        worksheet.columns = [
            { header: 'ALU', key: 'alu', width: 15 },
            { header: 'Descripcion', key: 'descripcion', width: 50 },
            { header: 'CodigoBarra', key: 'codigoBarra', width: 20 },
            { header: 'Precio', key: 'precio', width: 15 }
        ];
        
        // Agregar los productos
        products.forEach(product => {
            worksheet.addRow({
                alu: product.ALU,
                descripcion: product.Descripcion,
                codigoBarra: product.CodigoBarra,
                precio: product.Precio
            });
        });
        
        // Asegurarse que el directorio existe
        const dir = path.dirname(config.excelPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Si el archivo existe, eliminarlo primero
        if (fs.existsSync(config.excelPath)) {
            logger.info('Eliminando archivo Excel existente...');
            fs.unlinkSync(config.excelPath);
        }
        
        // Guardar el nuevo archivo
        logger.info('Guardando nuevo archivo Excel...');
        await workbook.xlsx.writeFile(config.excelPath);
        logger.info('Archivo Excel actualizado correctamente.');
        
    } catch (error) {
        logger.error('Error al actualizar productos:', error);
        throw error;
    }
}

module.exports = {
    updateProducts
};