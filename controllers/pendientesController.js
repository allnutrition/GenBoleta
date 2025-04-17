const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config/config');
const boletaService = require('../services/boletaService');

/**
 * Obtiene la lista de documentos pendientes
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
async function obtenerPendientes(req, res) {
    try {
        const carpetaPendientes = config.RUTA_JSON_VENTAS;
        const archivosPendientes = await fs.readdir(carpetaPendientes);
        
        const documentos = archivosPendientes.filter(archivo => archivo.endsWith('.json'));
        
        if (documentos.length === 0) {
            return res.status(404).json({ error: "No existen documentos disponibles para sincronizar." });
        }
        
        res.json({ documentos });
    } catch (error) {
        logger.error(`Error al obtener documentos pendientes: ${error.message}`);
        res.status(500).json({ error: "Error al obtener documentos pendientes." });
    }
}

/**
 * Envía un documento pendiente
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
async function enviarPendiente(req, res) {
    const documento = req.body.documento;
    
    if (!documento) {
        return res.status(400).json({ error: "Documento no especificado." });
    }
    
    try {
        const resultado = await boletaService.procesarDocumentoPendiente(documento);
        
        if (resultado) {
            res.json({ message: `Documento '${documento}' enviado correctamente.` });
        } else {
            res.status(500).json({ error: "No se pudo enviar el documento al servidor externo." });
        }
    } catch (error) {
        logger.error(`Error al enviar documento pendiente: ${error.message}`);
        res.status(500).json({ error: "Error al procesar el documento." });
    }
}

module.exports = {
    obtenerPendientes,
    enviarPendiente
};