const express = require("express");
const router = express.Router();
const verificarToken = require("../middlewares/verificarToken");
const incidenciasEstadosController = require("../controllers/incidencias_estados.controller");

/**
 * @swagger
 * tags:
 *   name: IncidenciasEstados
 *   description: Historial de cambios de estado de las incidencias
 */

/**
 * @swagger
 * /api/v1/incidencias_estados:
 *   get:
 *     summary: Historial de cambios de estado (requiere token)
 *     tags: [IncidenciasEstados]
 *     security: [{ bearerAuth: [] }]
 */
// GET /api/v1/incidencias_estados -> Historial de cambios de estado de las incidencias
router.get("/", verificarToken, incidenciasEstadosController.listar);

module.exports = router;
