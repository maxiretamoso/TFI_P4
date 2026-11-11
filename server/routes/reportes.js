import express from "express";
import { query } from "express-validator";
import verificarToken from "../middlewares/verificarToken.js";
import verificarRol from "../middlewares/verificarRol.js";
import * as reportesController from "../controllers/reportes.controller.js";
import { ROLES } from "../config/constantes.js";
import { FILTROS_DE_REPORTE } from "../services/reportes.service.js";

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

export default router;
