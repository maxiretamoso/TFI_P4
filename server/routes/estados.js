import express from "express";
import { param } from "express-validator";
import verificarToken from "../middlewares/verificarToken.js";
import * as estadosController from "../controllers/estados.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Estados
 *   description: >
 *     Estados por los que pasa una incidencia. Son de solo lectura: el flujo
 *     (Pendiente, En Proceso, Resuelta, Cancelada) depende de esos cuatro valores.
 */

/**
 * @swagger
 * /estados:
 *   get:
 *     summary: Lista los estados activos
 *     tags: [Estados]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista de estados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_estado:   { type: integer, example: 1 }
 *                   descripcion: { type: string, example: Pendiente }
 *                   activo:      { type: integer, example: 1 }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 */
router.get("/", verificarToken, estadosController.listar);

/**
 * @swagger
 * /estados/{id}:
 *   get:
 *     summary: Obtiene un estado por id
 *     tags: [Estados]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: El estado pedido }
 *       400: { $ref: '#/components/responses/DatosInvalidos' }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 */
router.get("/:id", verificarToken, [param("id").isInt({ min: 1 })], estadosController.obtenerPorId);

export default router;
