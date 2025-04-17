const schedule = require('node-schedule');
const { getProductsData } = require('./dbConnection');
const { updateProductsExcel } = require('./excelManager');
const config = require('./config');
const logger = require('./logger');

// Mantener referencias a los trabajos programados
let jobs = [];

/**
 * Ejecuta el proceso de actualización de productos
 */
async function updateProcess() {
    try {
        logger.info('Iniciando proceso de actualización de productos...');
        
        // Obtener datos de la base de datos
        const productsData = await getProductsData();
        
        // Actualizar el archivo Excel
        await updateProductsExcel(productsData);
        
        logger.info('Proceso de actualización completado con éxito.');
    } catch (err) {
        logger.error(`Error en el proceso de actualización: ${err.message}`);
    }
}

/**
 * Configura las tareas programadas según la configuración
 */
function setupScheduledJobs() {
    logger.info('Configurando tareas programadas...');
    
    // Cancelar trabajos existentes
    jobs.forEach(job => job.cancel());
    jobs = [];
    
    // Programar la actualización de la mañana
    logger.info(`Programando actualización matutina: ${config.schedule.morning}`);
    const morningJob = schedule.scheduleJob(config.schedule.morning, updateProcess);
    jobs.push(morningJob);
    
    // Programar la actualización de la tarde
    logger.info(`Programando actualización vespertina: ${config.schedule.afternoon}`);
    const afternoonJob = schedule.scheduleJob(config.schedule.afternoon, updateProcess);
    jobs.push(afternoonJob);
    
    logger.info('Tareas programadas configuradas correctamente.');
}

/**
 * Ejecuta el proceso inmediatamente y configura las tareas programadas
 */
async function start() {
    try {
        // Ejecutar la actualización inmediata al iniciar
        await updateProcess();
        
        // Configurar las tareas programadas
        setupScheduledJobs();
        
        return true;
    } catch (err) {
        logger.error(`Error al iniciar el programador: ${err.message}`);
        return false;
    }
}

/**
 * Detiene todas las tareas programadas
 */
function stop() {
    logger.info('Deteniendo tareas programadas...');
    jobs.forEach(job => job.cancel());
    jobs = [];
    logger.info('Todas las tareas programadas han sido detenidas.');
}

module.exports = { start, stop, updateProcess };