const express = require("express");
const { body, param } = require("express-validator");
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");
const categoriasController = require("../controllers/categorias.controller");
const { ROLES } = require("../config/roles");

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
 *     summary: Crea una categorias
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
 *     summary: Obtiene una categorias por id
 *     tags: [Categorias]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: El recurso pedido }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 *   put:
 *     summary: Modifica una categorias
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
 *     summary: Da de baja una categorias (soft delete, activo = 0)
 *     tags: [Categorias]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       204: { description: Dada de baja }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
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

module.exports = router;
