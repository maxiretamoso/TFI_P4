import express from "express";
import { body, param } from "express-validator";
import verificarToken from "../middlewares/verificarToken.js";
import verificarRol from "../middlewares/verificarRol.js";
import * as areasController from "../controllers/areas.controller.js";
import { ROLES } from "../config/roles.js";

const router = express.Router();

const PUEDEN_GESTIONAR = [ROLES.DIRECTOR];

/**
 * @swagger
 * tags:
 *   name: Areas
 *   description: BREAD de áreas
 */

/**
 * @swagger
 * /areas:
 *   get:
 *     summary: Lista áreas activas
 *     tags: [Areas]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de áreas }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 *   post:
 *     summary: Crea un área
 *     tags: [Areas]
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
router.get("/", verificarToken, areasController.listar);

router.post(
  "/",
  verificarToken,
  verificarRol(...PUEDEN_GESTIONAR),
  [body("descripcion").isString().trim().isLength({ min: 1, max: 250 })],
  areasController.crear
);

/**
 * @swagger
 * /areas/{id}:
 *   get:
 *     summary: Obtiene un área por id
 *     tags: [Areas]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: El recurso pedido }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 *   put:
 *     summary: Modifica un área
 *     tags: [Areas]
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
 *     summary: Da de baja un área (soft delete, activo = 0)
 *     tags: [Areas]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       204: { description: Dada de baja }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 *       409: { description: El área tiene usuarios o artículos activos }
 */
router.get("/:id", verificarToken, [param("id").isInt({ min: 1 })], areasController.obtenerPorId);

router.put(
  "/:id",
  verificarToken,
  verificarRol(...PUEDEN_GESTIONAR),
  [param("id").isInt({ min: 1 }), body("descripcion").isString().trim().isLength({ min: 1, max: 250 })],
  areasController.actualizar
);

router.delete(
  "/:id",
  verificarToken,
  verificarRol(...PUEDEN_GESTIONAR),
  [param("id").isInt({ min: 1 })],
  areasController.eliminar
);

export default router;
