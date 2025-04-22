const schedule = require('node-schedule');
const config = require('./config');
const excelManager = require('./excelManager');
const logger = require('./logger');

let retryTimeout;
const RETRY_DELAY = config.schedule.interval.retryDelayHours * 60 * 60 * 1000; // convertir horas a milisegundos

async function executeUpdate() {
    try {
        logger.info('Iniciando actualización programada...');
        await excelManager.updateProducts();
        logger.info('Actualización programada completada con éxito.');
        
        // Limpiar cualquier retry pendiente ya que la actualización fue exitosa
        if (retryTimeout) {
            clearTimeout(retryTimeout);
            retryTimeout = null;
        }
    } catch (error) {
        logger.error('Error durante la actualización programada:', error);
        
        // Programar reintento
        logger.info(`Programando reintento en ${config.schedule.interval.retryDelayHours} horas...`);
        retryTimeout = setTimeout(executeUpdate, RETRY_DELAY);
    }
}

function scheduleFixedTimes() {
    const { morning, afternoon } = config.schedule.fixedTimes;
    
    // Programar actualización de la mañana
    schedule.scheduleJob(morning, executeUpdate);
    logger.info(`Servicio programado para ejecutarse a las ${morning}`);
    
    // Programar actualización de la tarde
    schedule.scheduleJob(afternoon, executeUpdate);
    logger.info(`Servicio programado para ejecutarse a las ${afternoon}`);
}

function scheduleByInterval() {
    // Ejecutar inmediatamente la primera vez
    executeUpdate();
    
    // Programar ejecuciones cada X horas
    const rule = new schedule.RecurrenceRule();
    rule.hour = new schedule.Range(0, 23, config.schedule.interval.hours);
    rule.minute = 0;
    
    schedule.scheduleJob(rule, executeUpdate);
    logger.info(`Servicio programado para ejecutarse cada ${config.schedule.interval.hours} horas`);
}

function startScheduler() {
    logger.info('Iniciando programador de actualizaciones...');
    
    if (config.schedule.mode === 'fixed') {
        scheduleFixedTimes();
    } else {
        scheduleByInterval();
    }
}

module.exports = {
    startScheduler
};