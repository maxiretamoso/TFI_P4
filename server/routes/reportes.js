const express = require("express");
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");
const reportesController = require("../controllers/reportes.controller");
const { ROLES } = require("../config/roles");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reportes
 *   description: Reportes estadísticos en PDF
 */

/**
 * @swagger
 * /reportes/incidencias:
 *   get:
 *     summary: Genera el reporte estadístico de incidencias en PDF
 *     tags: [Reportes]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Archivo PDF
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 */
router.get(
  "/incidencias",
  verificarToken,
  verificarRol(ROLES.DIRECTOR),
  reportesController.generarReporteIncidencias
);

module.exports = router;
