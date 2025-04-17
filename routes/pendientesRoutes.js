const express = require('express');
const router = express.Router();
const pendientesController = require('../controllers/pendientesController');

// Ruta para obtener documentos pendientes
router.get('/obtener_pendientes', pendientesController.obtenerPendientes);

// Ruta para enviar un documento pendiente
router.post('/enviar_pendientes', pendientesController.enviarPendiente);

module.exports = router;