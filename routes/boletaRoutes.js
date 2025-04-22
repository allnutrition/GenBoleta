const express = require('express');
const router = express.Router();
const boletaController = require('../controllers/boletaController');

router.get('/debug/productos', async (req, res) => {
    try {
        const productos = await excelUtils.readExcelFile(config.EXCEL_PRODUCTOS);
        res.json({
            total: productos.length,
            primeros5: productos.slice(0,5)
        });
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

// Ruta para obtener la configuración
router.get('/obtener_configuracion', boletaController.obtenerConfiguracion);

// Ruta para consultar un código de barras
router.post('/consultar_codigo', boletaController.consultarCodigo);

// Ruta para generar una boleta
router.post('/generar_boleta', boletaController.generarBoleta);

module.exports = router;