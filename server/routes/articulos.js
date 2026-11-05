import express from "express";
import { body, param } from "express-validator";
import verificarToken from "../middlewares/verificarToken.js";
import verificarRol from "../middlewares/verificarRol.js";
import * as articulosController from "../controllers/articulos.controller.js";
import { ROLES } from "../config/roles.js";

const router = express.Router();

const PUEDEN_GESTIONAR = [ROLES.EMPLEADO_SISTEMAS, ROLES.DIRECTOR];

/**
 * @swagger
 * tags:
 *   name: Articulos
 *   description: BREAD de artículos
 */

/**
 * @swagger
 * /articulos:
 *   get:
 *     summary: Lista los artículos activos
 *     tags: [Articulos]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista de artículos con su área y categoría
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Articulo' }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 *   post:
 *     summary: Crea un artículo
 *     tags: [Articulos]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_area, id_categoria, descripcion]
 *             properties:
 *               id_area:      { type: integer }
 *               id_categoria: { type: integer }
 *               descripcion:  { type: string, maxLength: 250 }
 *     responses:
 *       201: { description: Artículo creado }
 *       400: { $ref: '#/components/responses/DatosInvalidos' }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 */
router.get("/", verificarToken, articulosController.listar);

router.post(
  "/",
  verificarToken,
  verificarRol(...PUEDEN_GESTIONAR),
  [
    body("id_area").isInt({ min: 1 }),
    body("id_categoria").isInt({ min: 1 }),
    body("descripcion").isString().trim().isLength({ min: 1, max: 250 }),
  ],
  articulosController.crear
);

/**
 * @swagger
 * /articulos/{id}:
 *   get:
 *     summary: Obtiene un artículo por id
 *     tags: [Articulos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: El artículo pedido }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 *   put:
 *     summary: Modifica un artículo
 *     tags: [Articulos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_area:      { type: integer }
 *               id_categoria: { type: integer }
 *               descripcion:  { type: string, maxLength: 250 }
 *     responses:
 *       200: { description: Artículo modificado }
 *       400: { $ref: '#/components/responses/DatosInvalidos' }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 *   delete:
 *     summary: Da de baja un artículo (soft delete, activo = 0)
 *     tags: [Articulos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       204: { description: Artículo dado de baja }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 */
router.get("/:id", verificarToken, [param("id").isInt({ min: 1 })], articulosController.obtenerPorId);

router.put(
  "/:id",
  verificarToken,
  verificarRol(...PUEDEN_GESTIONAR),
  [
    param("id").isInt({ min: 1 }),
    body("id_area").optional().isInt({ min: 1 }),
    body("id_categoria").optional().isInt({ min: 1 }),
    body("descripcion").optional().isString().trim().isLength({ min: 1, max: 250 }),
  ],
  articulosController.actualizar
);

router.delete(
  "/:id",
  verificarToken,
  verificarRol(...PUEDEN_GESTIONAR),
  [param("id").isInt({ min: 1 })],
  articulosController.eliminar
);

export default router;
