const boletaService = require('../services/boletaService');
const logger = require('../utils/logger');
const config = require('../config/config');
const excelUtils = require('../utils/excelUtils');
const fs = require('fs-extra');
const path = require('path');

/**
 * Obtiene la configuración de la aplicación
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
async function obtenerConfiguracion(req, res) {
    try {
        res.json({
            VALIDAR_PRODUCTOS: config.VALIDAR_PRODUCTOS,
            RUT_EMISOR: config.RUT_EMISOR,
            RAZON_SOCIAL: config.RAZON_SOCIAL,
            NUMERO_TIENDA: config.NUMERO_TIENDA,
            DIR_ORIGEN: config.DIR_ORIGEN
        });
    } catch (error) {
        logger.error(`Error al obtener configuración: ${error.message}`);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
}

/**
 * Consulta un producto por su código de barras
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
async function consultarCodigo(req, res) {
    const codigoBarras = req.body.codigo || "";

    try {
        // Verificar si se debe validar contra el Excel o permitir datos manuales
        if (config.VALIDAR_PRODUCTOS) {
            if (codigoBarras) {
                const producto = await excelUtils.buscarProductoPorCodigo(codigoBarras);
                if (producto) {
                    return res.json(producto);
                } else {
                    return res.status(404).json({ error: "Código de barra no encontrado." });
                }
            } else {
                logger.error("Código de barra vacío al validar productos.");
                return res.status(400).json({ error: "Debe ingresar un código de barra válido." });
            }
        } else {
            // Si no se valida el producto, permitir campos de ingreso libre sin código de barra
            return res.json({ alu: "", precio: 0.0, descripcion: "" });
        }
    } catch (error) {
        logger.error(`Error al consultar código de barras: ${error.message}`);
        res.status(500).json({ error: "Error al consultar el código de barras." });
    }
}

/**
 * Genera una boleta electrónica
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
async function generarBoleta(req, res) {
    const productos = req.body.productos || [];

    try {
        // Validar productos
        for (const producto of productos) {
            if (producto.precio === null || producto.cantidad === null) {
                return res.status(400).json({ 
                    error: "Cada producto debe tener un precio y una cantidad válidos." 
                });
            }
            
            producto.precio = parseFloat(producto.precio);
            producto.cantidad = parseInt(producto.cantidad);
            
            // Asignar descripción genérica si VALIDAR_PRODUCTOS es false y no se proporciona una descripción
            if (!config.VALIDAR_PRODUCTOS && !producto.descripcion) {
                producto.descripcion = "DESCRIPCION GENERICA DE PRODUCTO";
            }
        }

        // Solicitar folio
        const folio = await boletaService.solicitarFolio();
        if (!folio) {
            return res.status(500).json({ error: "No se pudo obtener un folio válido" });
        }

        // Generar XML de la boleta
        const xmlContent = await boletaService.generarXmlBoleta(folio, productos);
        
        // Enviar boleta al servicio
        await boletaService.enviarBoleta(xmlContent);
        
        // Extraer el PDF en base64
        const pdfBase64 = await boletaService.extractPdfFromResponse();
        if (!pdfBase64) {
            return res.status(500).json({ error: "No se pudo extraer el PDF de la respuesta." });
        }

        // Decodificar y guardar el PDF usando el número de folio
        const pdfFilename = `boleta_${folio}.pdf`;
        const pdfPath = path.join(config.PDF_SAVE_PATH, pdfFilename);
        await fs.ensureDir(config.PDF_SAVE_PATH);
        
        // Convertir base64 a buffer y guardar
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');
        await fs.writeFile(pdfPath, pdfBuffer);

        // Generar y guardar el JSON de la venta
        const ventaData = {
            numero_tienda: config.NUMERO_TIENDA,
            fecha_venta: new Date().toISOString(),
            folio_boleta: folio,
            productos: productos.map(prod => ({
                alu: prod.alu,
                descripcion: prod.descripcion || "DESCRIPCION GENERICA DE PRODUCTO",
                precio_unitario: Math.floor(prod.precio),
                cantidad: prod.cantidad,
                subtotal: Math.floor(prod.precio * prod.cantidad)
            })),
            totales: {
                neto: Math.floor(productos.reduce((sum, prod) => 
                    sum + (prod.precio * prod.cantidad / 1.19), 0)),
                iva: Math.floor(productos.reduce((sum, prod) => 
                    sum + (prod.precio * prod.cantidad - (prod.precio * prod.cantidad / 1.19)), 0)),
                total: Math.floor(productos.reduce((sum, prod) => 
                    sum + (prod.precio * prod.cantidad), 0))
            }
        };

        // Guardar el JSON en la ruta configurada
        const jsonFilename = `venta_${folio}.json`;
        const jsonPath = path.join(config.RUTA_JSON_VENTAS, jsonFilename);
        await fs.ensureDir(config.RUTA_JSON_VENTAS);
        await fs.writeJson(jsonPath, ventaData, { spaces: 4 });

        // Responder con éxito
        res.json({
            message: "Boleta generada y enviada con éxito.",
            pdf_url: `/ver_pdf/${pdfFilename}`
        });

    } catch (error) {
        logger.error(`Error en el proceso de generación de boleta: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    obtenerConfiguracion,
    consultarCodigo,
    generarBoleta
};