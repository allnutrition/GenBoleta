const express = require('express');
const router = express.Router();
const boletaController = require('../controllers/boletaController');

// Ruta para obtener la configuración
router.get('/obtener_configuracion', boletaController.obtenerConfiguracion);

// Ruta para consultar un código de barras
router.post('/consultar_codigo', boletaController.consultarCodigo);

// Ruta para generar una boleta
router.post('/generar_boleta', boletaController.generarBoleta);

module.exports = router;