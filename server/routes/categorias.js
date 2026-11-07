import express from "express";
import { body, param } from "express-validator";
import verificarToken from "../middlewares/verificarToken.js";
import verificarRol from "../middlewares/verificarRol.js";
import * as categoriasController from "../controllers/categorias.controller.js";
import { ROLES } from "../config/roles.js";

const router = express.Router();

const PUEDEN_GESTIONAR = [ROLES.EMPLEADO_SISTEMAS, ROLES.DIRECTOR];

/**
 * @swagger
 * tags:
 *   name: Categorias
 *   description: BREAD de categorías
 */

/**
 * @swagger
 * /categorias:
 *   get:
 *     summary: Lista categorías activas
 *     tags: [Categorias]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de categorías }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 *   post:
 *     summary: Crea una categoría
 *     tags: [Categorias]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [descripcion]
 *             properties:
 *               descripcion: { type: string, maxLength: 250 }
 *     responses:
 *       201: { description: Creada }
 *       400: { $ref: '#/components/responses/DatosInvalidos' }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 */
router.get("/", verificarToken, categoriasController.listar);

router.post(
  "/",
  verificarToken,
  verificarRol(...PUEDEN_GESTIONAR),
  [body("descripcion").isString().trim().isLength({ min: 1, max: 250 })],
  categoriasController.crear
);

/**
 * @swagger
 * /categorias/{id}:
 *   get:
 *     summary: Obtiene una categoría por id
 *     tags: [Categorias]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: El recurso pedido }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 *   put:
 *     summary: Modifica una categoría
 *     tags: [Categorias]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [descripcion]
 *             properties:
 *               descripcion: { type: string, maxLength: 250 }
 *     responses:
 *       200: { description: Modificada }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 *   delete:
 *     summary: Da de baja una categoría (soft delete, activo = 0)
 *     tags: [Categorias]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       204: { description: Dada de baja }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 *       409: { description: La categoría tiene artículos activos }
 */
router.get("/:id", verificarToken, [param("id").isInt({ min: 1 })], categoriasController.obtenerPorId);

router.put(
  "/:id",
  verificarToken,
  verificarRol(...PUEDEN_GESTIONAR),
  [param("id").isInt({ min: 1 }), body("descripcion").isString().trim().isLength({ min: 1, max: 250 })],
  categoriasController.actualizar
);

router.delete(
  "/:id",
  verificarToken,
  verificarRol(...PUEDEN_GESTIONAR),
  [param("id").isInt({ min: 1 })],
  categoriasController.eliminar
);

export default router;
