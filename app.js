const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const config = require('./config/config');
const logger = require('./utils/logger');
const boletaRoutes = require('./routes/boletaRoutes');
const pendientesRoutes = require('./routes/pendientesRoutes');

// Crear la aplicación Express
const app = express();

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Servir archivos estáticos - asegurarse que el directorio 'public' exista
if (fs.existsSync(path.join(__dirname, 'public'))) {
    app.use(express.static(path.join(__dirname, 'public')));
} else {
    // Si hay problema con el directorio público, intentar usar configuración
    app.use(express.static(config.STATIC_FOLDER));
}

// Crear directorios necesarios
fs.ensureDirSync(path.join(config.BASE_DIR, 'logs'));
fs.ensureDirSync(config.PDF_SAVE_PATH);
fs.ensureDirSync(config.RUTA_JSON_VENTAS);
fs.ensureDirSync(path.dirname(config.EXCEL_PRODUCTOS));

// Rutas principales
app.get('/', (req, res) => {
    res.render('home');  // Renderizar la página de inicio (home)
});

app.get('/index', (req, res) => {
    res.render('index');  // Renderizar la página de generación de boletas
});

app.get('/enviar_boletas_pendientes', (req, res) => {
    res.render('enviar_pendientes');  // Renderizar la página de envío de boletas pendientes
});

// Ruta para ver PDF
app.get('/ver_pdf/:pdf_filename', (req, res) => {
    const pdfPath = path.join(config.PDF_SAVE_PATH, req.params.pdf_filename);
    if (fs.existsSync(pdfPath)) {
    res.sendFile(pdfPath);
    } else {
    res.status(404).json({ error: "El archivo PDF no está disponible." });
    }
});

// Usar las rutas de la API
app.use('/', boletaRoutes);
app.use('/', pendientesRoutes);

module.exports = app;