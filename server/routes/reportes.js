const express = require("express");
const { query } = require("express-validator");
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");
const reportesController = require("../controllers/reportes.controller");
const { ROLES } = require("../config/roles");
const { FILTROS_DE_REPORTE } = require("../services/reportes.service");

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
 *     summary: Genera el reporte de incidencias en PDF
 *     description: Listado de incidencias con totales por estado, prioridad y área.
 *     tags: [Reportes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: filtro
 *         schema: { type: string, enum: [pendientes, en_proceso, resueltas, canceladas] }
 *         description: Sin filtro incluye todas las incidencias
 *     responses:
 *       200:
 *         description: Archivo PDF
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *       400: { $ref: '#/components/responses/DatosInvalidos' }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 */
router.get(
  "/incidencias",
  verificarToken,
  verificarRol(ROLES.DIRECTOR),
  [query("filtro").optional().isIn(FILTROS_DE_REPORTE).withMessage("El filtro no es válido")],
  reportesController.generarReporteIncidencias
);

module.exports = router;
