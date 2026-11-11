import express from "express";
import verificarToken from "../middlewares/verificarToken.js";
import verificarRol from "../middlewares/verificarRol.js";
import * as historialController from "../controllers/incidencias_estados.controller.js";
import { ROLES } from "../../shared/constantes.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Historial
 *   description: Historial de cambios de estado de todas las incidencias
 */

/**
 * @swagger
 * /incidencias-estados:
 *   get:
 *     summary: Lista el historial completo de cambios de estado
 *     description: El historial de una incidencia puntual está en /incidencias/{id}/estados.
 *     tags: [Historial]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Historial completo }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 */
router.get("/", verificarToken, verificarRol(ROLES.DIRECTOR), historialController.listar);

export default router;
