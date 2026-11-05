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
 *     summary: Estadísticas e incidencias prioritarias del panel del Director
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
 *                 indicadores:
 *                   type: object
 *                   properties:
 *                     abiertas:       { type: integer, description: Pendientes más en proceso, example: 6 }
 *                     altas_abiertas: { type: integer, description: Abiertas de prioridad Alta, example: 2 }
 *                     ultimos_7_dias: { type: integer, description: Creadas en los últimos 7 días, example: 3 }
 *                     sin_asignar:    { type: integer, description: Pendientes todavía a cargo del Director, example: 1 }
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
 *                   description: Las últimas 7 fechas en que se crearon incidencias, la más reciente primero
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
 *                 porCategoria:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       categoria: { type: string, example: Periféricos }
 *                       total:     { type: integer, example: 7 }
 *                 prioritarias:
 *                   type: array
 *                   description: Hasta 10 incidencias abiertas de prioridad Alta, la más antigua primero
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_incidencia:      { type: integer }
 *                       descripcion_pedido: { type: string }
 *                       creado:             { type: string, format: date-time }
 *                       id_estado:          { type: integer }
 *                       estado:             { type: string }
 *                       articulo:           { type: string }
 *                       asignado_nombres:   { type: string }
 *                       asignado_apellidos: { type: string }
 *                       creador_nombres:    { type: string }
 *                       creador_apellidos:  { type: string }
 *                 cargaPorEmpleado:
 *                   type: array
 *                   description: Incidencias abiertas y resueltas de cada empleado de Sistemas
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_usuario: { type: integer }
 *                       nombres:    { type: string }
 *                       apellidos:  { type: string }
 *                       abiertas:   { type: integer }
 *                       resueltas:  { type: integer }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 */
router.get("/", verificarToken, verificarRol(ROLES.DIRECTOR), dashboardController.obtenerResumen);

module.exports = router;
