const soap = require('soap');
const fs = require('fs-extra');
const path = require('path');
const xml2js = require('xml2js');
const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Solicita un folio al servicio SOAP
 * @returns {Promise<string|null>} El folio obtenido o null si hay error
 */
async function solicitarFolio() {
    try {
        // Crear cliente SOAP
        logger.debug(`Intentando conectar al servicio SOAP en: ${config.SOAP_WSDL_URL}`);
        const client = await soap.createClientAsync(config.SOAP_WSDL_URL);
        
        // Parámetros para la solicitud
        const params = {
            RutEmpresa: config.RUT_EMISOR,
            TipoDocto: config.TIPO_DTE
        };
        
        logger.debug(`Enviando solicitud de folio con los siguientes parámetros:`);
        logger.debug(`RUT de la empresa (emisor): ${params.RutEmpresa}`);
        logger.debug(`Tipo de documento: ${params.TipoDocto}`);
        
        // Realizar la solicitud SOAP
        logger.debug(`Ejecutando método Solicitar_Folio...`);
        const result = await client.Solicitar_FolioAsync(params);
        
        // Guardar la respuesta completa para análisis
        const responseStr = JSON.stringify(result, null, 2);
        logger.debug(`Respuesta completa del servicio de folio: ${responseStr}`);
        
        // Guardar la respuesta en un archivo para análisis
        await fs.writeFile(
            path.join(config.BASE_DIR, 'logs', 'folio_response.json'), 
            responseStr, 
            'utf8'
        );
        
        // Extraer el folio de la respuesta correctamente
        // La respuesta tiene la estructura [result, soapHeader, rawResponse, ...]
        if (result && result[0] && result[0].Solicitar_FolioResult) {
            const folio = result[0].Solicitar_FolioResult.Folio;
            
            if (folio) {
                logger.info(`Folio obtenido: ${folio}`);
                return folio;
            } else {
                logger.error(`La respuesta del servicio no contiene un folio. Respuesta: ${responseStr}`);
                return null;
            }
        } else {
            // Intento alternativo de extracción si la estructura es diferente
            if (result && result[0] && result[0].Folio) {
                const folio = result[0].Folio;
                logger.info(`Folio obtenido (estructura alternativa): ${folio}`);
                return folio;
            }
            
            logger.error(`Respuesta vacía o inválida del servicio SOAP: ${responseStr}`);
            return null;
        }
    } catch (error) {
        logger.error(`Error al solicitar folio: ${error.message}`);
        logger.error(`Stack trace: ${error.stack}`);
        return null;
    }
}

/**
 * Genera el XML de la boleta
 * @param {string} folio - El folio de la boleta
 * @param {Array} productos - Lista de productos para la boleta
 * @returns {Promise<string>} El contenido XML de la boleta
 */
async function generarXmlBoleta(folio, productos) {
    try {
        // Calcular los totales generales
        let montoNetoTotal = 0;
        let ivaTotal = 0;
        let montoTotal = 0;

        // Calcular montos por cada producto
        productos.forEach(producto => {
            const cantidad = producto.cantidad;
            const precio = producto.precio;
            const montoItem = cantidad * precio;
            const montoNetoItem = Math.floor(montoItem / 1.19);
            const ivaItem = Math.floor(montoItem - montoNetoItem);

            montoNetoTotal += montoNetoItem;
            ivaTotal += ivaItem;
            montoTotal += montoItem;
        });

        // Convertir totales a enteros
        montoNetoTotal = Math.floor(montoNetoTotal);
        ivaTotal = Math.floor(ivaTotal);
        montoTotal = Math.floor(montoTotal);

        // Fecha y hora actual
        const now = new Date();
        const fechaHora = now.toISOString().replace(/[^0-9]/g, "").substring(0, 14);
        const fechaEmision = now.toISOString().split('T')[0];
        const horaEmision = now.toISOString().split('T')[1].substring(0, 8);

        // Crear estructura XML
        const xmlObj = {
            'EnvioBOLETA': {
                '$': {
                    'version': '1.0',
                    'xmlns': 'http://www.sii.cl/SiiDte'
                },
                'SetDTE': {
                    '$': {
                        'ID': `ENVBOL-${fechaHora}`
                    },
                    'Caratula': {
                        '$': {
                            'version': '1.0'
                        },
                        'RutEmisor': config.RUT_EMISOR,
                        'RutEnvia': config.RUT_ENVIA,
                        'RutReceptor': config.RUT_RECEPTOR,
                        'FchResol': '2013-03-07',
                        'NroResol': '0',
                        'TmstFirmaEnv': `${fechaEmision}T${horaEmision}`,
                        'SubTotDTE': {
                            'TpoDTE': config.TIPO_DTE.toString(),
                            'NroDTE': '1'
                        }
                    },
                    'DTE': {
                        '$': {
                            'version': '1.0'
                        },
                        'Documento': {
                            '$': {
                                'ID': `R${config.RUT_EMISOR.replace('-', '')}T${config.TIPO_DTE}F${folio}`
                            },
                            'Encabezado': {
                                'IdDoc': {
                                    'TipoDTE': config.TIPO_DTE.toString(),
                                    'Folio': folio.toString(),
                                    'FchEmis': fechaEmision,
                                    'IndServicio': '3'
                                },
                                'Emisor': {
                                    'RUTEmisor': config.RUT_EMISOR,
                                    'RznSocEmisor': config.RAZON_SOCIAL,
                                    'GiroEmisor': config.GIRO_EMISOR,
                                    'CdgSIISucur': config.CDG_SII_SUCUR,
                                    'DirOrigen': config.DIR_ORIGEN,
                                    'CmnaOrigen': config.CMNA_ORIGEN,
                                    'CiudadOrigen': config.CDAD_ORIGEN
                                },
                                'Receptor': {
                                    'RUTRecep': config.RUT_RECEPTOR,
                                    'RznSocRecep': 'ClienteGenerico',
                                    'DirRecep': 'Sin direccion',
                                    'CiudadRecep': 'Santiago'
                                },
                                'Totales': {
                                    'MntNeto': montoNetoTotal.toString(),
                                    'MntExe': '0',
                                    'IVA': ivaTotal.toString(),
                                    'MntTotal': montoTotal.toString()
                                }
                            },
                            'Detalle': productos.map((producto, idx) => {
                                const alu = producto.alu;
                                const cantidad = producto.cantidad;
                                const precio = Math.floor(producto.precio);
                                const descripcion = producto.descripcion || "DESCRIPCION GENERICA DE PRODUCTO";
                                const montoItem = Math.floor(cantidad * precio);

                                return {
                                    'NroLinDet': (idx + 1).toString(),
                                    'CdgItem': {
                                        'TpoCodigo': 'ALU',
                                        'VlrCodigo': alu
                                    },
                                    'NmbItem': descripcion,
                                    'DscItem': descripcion,
                                    'QtyItem': cantidad.toString(),
                                    'PrcItem': precio.toString(),
                                    'MontoItem': montoItem.toString()
                                };
                            }),
                            'TmstFirma': `${fechaEmision}T${horaEmision}`
                        }
                    }
                }
            }
        };

        // Convertir objeto a XML
        const builder = new xml2js.Builder({
            xmldec: { version: '1.0', encoding: 'ISO-8859-1' },
            renderOpts: { pretty: true, indent: '  ', newline: '\n' }
        });
        
        const xmlContent = builder.buildObject(xmlObj);
        
        logger.info(`XML generado para la boleta con múltiples productos`);
        logger.debug(xmlContent);
        
        return xmlContent;
    } catch (error) {
        logger.error(`Error al generar XML de boleta: ${error.message}`);
        throw error;
    }
}

/**
 * Envía la boleta al servicio SOAP
 * @param {string} xmlContent - Contenido XML de la boleta
 * @returns {Promise<void>}
 */
async function enviarBoleta(xmlContent) {
    try {
        // Construir la solicitud SOAP
        const soapRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
            <soapenv:Header/>
            <soapenv:Body>
                <tem:Carga_TXTBoleta>
                    <tem:ArchivoTXT><![CDATA[${xmlContent}]]></tem:ArchivoTXT>
                    <tem:TipoArchivo>XML</tem:TipoArchivo>
                </tem:Carga_TXTBoleta>
            </soapenv:Body>
        </soapenv:Envelope>`;

        logger.debug(`Solicitud SOAP enviada al servicio:\n${soapRequest}`);

        // Configurar headers
        const headers = {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://tempuri.org/Carga_TXTBoleta'
        };

        // Enviar la solicitud
        const response = await axios.post(config.SOAP_WSDL_URL, soapRequest, { headers });
        
        // Guardar la respuesta
        await fs.writeFile(config.OUTPUT_PATH, `Respuesta del servicio:\n${response.data}`, 'utf8');
        
        logger.debug(`Respuesta del servicio SOAP:\n${response.data}`);
    } catch (error) {
        logger.error(`Error al enviar boleta: ${error.message}`);
        throw error;
    }
}

/**
 * Extrae el PDF en base64 de la respuesta del servicio
 * @returns {Promise<string|null>} Contenido del PDF en base64 o null si hay error
 */
async function extractPdfFromResponse() {
    try {
        const content = await fs.readFile(config.OUTPUT_PATH, 'utf8');
        
        // Extraer el contenido en base64 entre <PDF> y </PDF>
        const pdfBase64Match = content.match(/<PDF>(.*?)<\/PDF>/s);
        
        if (pdfBase64Match && pdfBase64Match[1]) {
            const pdfBase64 = pdfBase64Match[1];
            logger.debug("PDF extraído correctamente desde el archivo de respuesta.");
            return pdfBase64;
        } else {
            logger.error("No se encontró el contenido del PDF en la respuesta.");
            return null;
        }
    } catch (error) {
        logger.error(`Error inesperado al extraer el PDF del XML de respuesta: ${error.message}`);
        return null;
    }
}

/**
 * Procesa un documento pendiente
 * @param {string} documento - Nombre del archivo JSON a procesar
 * @returns {Promise<boolean>} True si el proceso fue exitoso, False en caso contrario
 */
async function procesarDocumentoPendiente(documento) {
    const carpetaPendientes = config.RUTA_JSON_VENTAS;
    const carpetaEnviados = path.join(config.BASE_DIR, "output", "json", "enviado");
    
    await fs.ensureDir(carpetaEnviados);
    
    const rutaArchivo = path.join(carpetaPendientes, documento);
    
    if (!await fs.pathExists(rutaArchivo)) {
        logger.error(`Archivo ${documento} no encontrado.`);
        return false;
    }
    
    logger.debug(`Procesando archivo: ${rutaArchivo}`);
    
    try {
        const data = await fs.readJson(rutaArchivo, { encoding: 'utf8' });
        
        const headers = {
            'Authorization': `Bearer ${config.AUTH_TOKEN}`,
            'Content-Type': 'application/json'
        };
        
        const response = await axios.post(config.ENDPOINT_URL, data, { headers });
        
        if (response.status === 200) {
            await fs.move(rutaArchivo, path.join(carpetaEnviados, documento));
            logger.info(`Archivo ${documento} enviado y movido a 'enviado'.`);
            return true;
        } else {
            logger.error(`Error ${response.status} al enviar ${documento}. Archivo no movido.`);
            return false;
        }
    } catch (error) {
        logger.error(`Error al procesar el archivo ${documento}: ${error.message}`);
        return false;
    }
}

module.exports = {
    solicitarFolio,
    generarXmlBoleta,
    enviarBoleta,
    extractPdfFromResponse,
    procesarDocumentoPendiente
};