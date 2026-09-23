const express = require("express");
const router = express.Router();
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");
const reportesController = require("../controllers/reportes.controller");

/**
 * @swagger
 * /api/v1/reportes/incidencias:
 *   get:
 *     summary: Genera PDF con estadísticas de incidencias (solo Director)
 *     tags: [Reportes]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/incidencias", verificarToken, verificarRol(3), reportesController.generarReporteIncidencias);

module.exports = router;
