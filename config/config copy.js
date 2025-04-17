const path = require('path');
const fs = require('fs-extra');

// Determinar directorio base (donde se ejecuta la aplicación)
const BASE_DIR = process.pkg 
  ? path.dirname(process.execPath) 
  : path.resolve(__dirname, '..');

// Asegurarse de que los directorios necesarios existan
const ensureDirectories = () => {
  const dirs = [
    path.join(BASE_DIR, "logs"),
    path.join(BASE_DIR, "output", "boleta"),
    path.join(BASE_DIR, "output", "json", "pendiente"),
    path.join(BASE_DIR, "data")
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Crear directorios necesarios
ensureDirectories();

const config = {
    BASE_DIR,
    
    // Rutas
    LOG_PATH: path.join(BASE_DIR, "logs", "app.log"),
    LOG_LEVEL: "info",
    PDF_SAVE_PATH: path.join(BASE_DIR, "output", "boleta"),
    RUTA_JSON_VENTAS: path.join(BASE_DIR, "output", "json", "pendiente"),
    EXCEL_PRODUCTOS: path.join(BASE_DIR, "data", "productos.xlsx"),
    OUTPUT_PATH: path.join(BASE_DIR, "output", "respuesta_boleta.txt"),
    STATIC_FOLDER: path.join(BASE_DIR, "public"),
    
    // Configuración de validación
    VALIDAR_PRODUCTOS: true,
    
    // Datos de conexión y empresa
    SOAP_WSDL_URL: "http://bes-cert.bestechnology.cl/wsfactlocal/dtelocal.asmx?wsdl",
    TIPO_DTE: 39,
    RUT_EMISOR: "76958630-K",
    RUT_ENVIA: "13458405-K",
    RUT_RECEPTOR: "1-9",
    RAZON_SOCIAL: "ALLNUTRITION",
    GIRO_EMISOR: "Ventas de Suplementos Alimenticios",
    CDG_SII_SUCUR: "82070535",
    DIR_ORIGEN: "Av. Del Valle 577",
    CMNA_ORIGEN: "Huechuraba",
    CDAD_ORIGEN: "Santiago",
    
    NUMERO_TIENDA: 35,
    
    // API para enviar JSON
    ENDPOINT_URL: "http://127.0.0.1:5000/api/transform",
    AUTH_TOKEN: "YhvsZK3b2yLxER92HyqplE76Lb3y1XV9v4ZGgK3HVcY"
};

module.exports = config;