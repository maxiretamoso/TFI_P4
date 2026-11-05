const express = require("express");
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");
const historialController = require("../controllers/incidencias_estados.controller");
const { ROLES } = require("../config/roles");

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

module.exports = router;
