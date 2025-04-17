// config.js - ACTUALIZADO PARA DISTRIBUCIÓN

const path = require('path');
const fs = require('fs-extra');

// Determinar directorio base de manera más robusta
const BASE_DIR = path.resolve(__dirname, '..');

// --- Inicio: Lógica para asegurar directorios y definir configuración base ---
const ensureDirectories = () => {
  const dirs = [
    path.join(BASE_DIR, "logs"),
    path.join(BASE_DIR, "output", "boleta"),
    path.join(BASE_DIR, "output", "json", "pendiente"),
    path.join(BASE_DIR, "output", "json", "enviado"),
    path.join(BASE_DIR, "data"),
    path.join(BASE_DIR, "config")
  ];

  dirs.forEach(dir => {
    // Usar fs-extra.ensureDirSync para crear si no existe
    fs.ensureDirSync(dir);
  });
};

// Crear directorios necesarios al inicio
ensureDirectories();

// Definir la configuración base/predeterminada
let config = {
    BASE_DIR,

    // Rutas (calculadas a partir de BASE_DIR)
    LOG_PATH: path.join(BASE_DIR, "logs", "app.log"),
    LOG_LEVEL: "info", // Predeterminado, puede ser sobrescrito
    PDF_SAVE_PATH: path.join(BASE_DIR, "output", "boleta"),
    RUTA_JSON_VENTAS: path.join(BASE_DIR, "output", "json", "pendiente"),
    EXCEL_PRODUCTOS: path.join(BASE_DIR, "data", "productos.xlsx"),
    OUTPUT_PATH: path.join(BASE_DIR, "output", "respuesta_boleta.txt"),
    STATIC_FOLDER: path.join(BASE_DIR, "public"),

    // Configuración de validación (puede ser sobrescrita)
    VALIDAR_PRODUCTOS: true,

    // Datos de conexión y empresa (pueden ser sobrescritos)
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

    NUMERO_TIENDA: 35, // Puede ser sobrescrito

    // API para enviar JSON (puede ser sobrescrita)
    ENDPOINT_URL: "http://127.0.0.1:5000/api/transform",
    AUTH_TOKEN: "YhvsZK3b2yLxER92HyqplE76Lb3y1XV9v4ZGgK3HVcY"
};

// --- Buscar archivo de configuración de sobrescritura ---
// Buscar en varias ubicaciones posibles
const possibleOverridePaths = [
    path.join(BASE_DIR, 'config.override.json'),
    path.join(BASE_DIR, 'config', 'config.override.json')
];

let overrideConfigPath = null;

// Buscar el archivo de configuración en las posibles ubicaciones
for (const configPath of possibleOverridePaths) {
    if (fs.existsSync(configPath)) {
        overrideConfigPath = configPath;
        break;
    }
}

try {
    if (overrideConfigPath) {
        console.log(`Cargando configuración externa desde: ${overrideConfigPath}`);
        // Leer el archivo JSON de sobrescritura
        const overrides = fs.readJsonSync(overrideConfigPath);

        // Fusionar las sobrescrituras con la configuración base
        config = { ...config, ...overrides };
        console.log("Configuración externa aplicada correctamente.");
    } else {
        console.log("No se encontró config.override.json. Usando configuración predeterminada.");
    }
} catch (error) {
    console.error(`Error al leer o parsear ${overrideConfigPath}: ${error.message}`);
    console.error("Se continuará con la configuración predeterminada o parcialmente sobrescrita.");
}

// Exportar la configuración final
module.exports = config;

// Imprimir resumen de configuración
console.log(`Configuración cargada: Tienda #${config.NUMERO_TIENDA}, Nivel log: ${config.LOG_LEVEL}`);