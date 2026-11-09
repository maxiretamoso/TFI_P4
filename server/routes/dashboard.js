import express from "express";
import verificarToken from "../middlewares/verificarToken.js";
import verificarRol from "../middlewares/verificarRol.js";
import * as dashboardController from "../controllers/dashboard.controller.js";
import { ROLES } from "../config/roles.js";

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
 *                       id_area: { type: integer, example: 3 }
 *                       area:  { type: string, example: Sistemas }
 *                       total: { type: integer, example: 9 }
 *                 porCategoria:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_categoria: { type: integer, example: 1 }
 *                       categoria: { type: string, example: Periféricos }
 *                       total:     { type: integer, example: 7 }
 *                 prioritarias:
 *                   type: array
 *                   description: Hasta 10 incidencias de prioridad Alta sin resolver (pendientes o en proceso), la más antigua primero
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_incidencia:      { type: integer }
 *                       descripcion_pedido: { type: string }
 *                       creado:             { type: string, format: date-time }
 *                       id_estado:          { type: integer }
 *                       estado:             { type: string }
 *                       articulo:           { type: string }
 *                       asignado_nombres:   { type: string, nullable: true, description: null si todavía no se asignó }
 *                       asignado_apellidos: { type: string, nullable: true }
 *                       creador_nombres:    { type: string }
 *                       creador_apellidos:  { type: string }
 *                 cargaPorEmpleado:
 *                   type: array
 *                   description: Incidencias en proceso, resueltas y canceladas de cada empleado de Sistemas
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_usuario: { type: integer }
 *                       nombres:    { type: string }
 *                       apellidos:  { type: string }
 *                       en_proceso: { type: integer }
 *                       resueltas:  { type: integer }
 *                       canceladas: { type: integer }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 */
router.get("/", verificarToken, verificarRol(ROLES.DIRECTOR), dashboardController.obtenerResumen);

export default router;
