const express = require("express");
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");
const dashboardController = require("../controllers/dashboard.controller");
const { ROLES } = require("../config/roles");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Panel de resumen del Director
 */

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Totales por estado, totales por fecha e incidencias prioritarias
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Datos del panel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:        { type: integer }
 *                 porEstado:    { type: array, items: { type: object } }
 *                 porFecha:     { type: array, items: { type: object } }
 *                 prioritarias: { type: array, items: { type: object } }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 */
router.get("/", verificarToken, verificarRol(ROLES.DIRECTOR), dashboardController.obtenerResumen);

module.exports = router;
