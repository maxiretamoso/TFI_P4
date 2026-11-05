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
 *     summary: Estadísticas del panel del Director
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
 *                 total:
 *                   type: integer
 *                   example: 18
 *                 porEstado:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_estado: { type: integer, example: 1 }
 *                       estado:    { type: string, example: Pendiente }
 *                       total:     { type: integer, example: 4 }
 *                 porFecha:
 *                   type: array
 *                   description: Días con incidencias creadas dentro del período
 *                   items:
 *                     type: object
 *                     properties:
 *                       fecha: { type: string, example: "2026-11-05" }
 *                       total: { type: integer, example: 2 }
 *                 porPrioridad:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       prioridad: { type: integer, example: 3 }
 *                       total:     { type: integer, example: 5 }
 *                 porArea:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       area:  { type: string, example: Sistemas }
 *                       total: { type: integer, example: 9 }
 *                 dias:
 *                   type: integer
 *                   description: Cantidad de días que cubre porFecha
 *                   example: 14
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 */
router.get("/", verificarToken, verificarRol(ROLES.DIRECTOR), dashboardController.obtenerResumen);

module.exports = router;
