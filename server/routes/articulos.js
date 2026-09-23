const express = require("express");
const router = express.Router();
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");
const { body } = require("express-validator");
const articulosController = require("../controllers/articulos.controller");

/**
 * @swagger
 * tags:
 *   name: Articulos
 *   description: BREAD de artículos
 */

/**
 * @swagger
 * /api/v1/articulos:
 *   get:
 *     summary: Listar artículos activos
 *     tags: [Articulos]
 *     responses: { 200: { description: Lista } }
 *   post:
 *     summary: Crear artículo (rol 2/3)
 *     tags: [Articulos]
 *     security: [{ bearerAuth: [] }]
 */
// Browse
router.get("/", articulosController.listar);

/**
 * @swagger
 * /api/v1/articulos/{id}:
 *   get:
 *     summary: Obtener artículo por id
 *     tags: [Articulos]
 *   put:
 *     summary: Editar artículo (rol 2/3)
 *     tags: [Articulos]
 *     security: [{ bearerAuth: [] }]
 *   delete:
 *     summary: Soft delete artículo (activo=0)
 *     tags: [Articulos]
 *     security: [{ bearerAuth: [] }]
 */
// Read
router.get("/:id", articulosController.obtenerPorId);

// Add
router.post("/", verificarToken, verificarRol(2, 3),
  [body("id_area").isInt(), body("id_categoria").isInt(), body("descripcion").isString().trim().isLength({ min: 1, max: 150 })],
  articulosController.crear
);

// Edit
router.put("/:id", verificarToken, verificarRol(2, 3),
  [body("id_area").optional().isInt(), body("id_categoria").optional().isInt(), body("descripcion").optional().isString().trim().isLength({ min: 1, max: 150 })],
  articulosController.actualizar
);

// Delete soft
router.delete("/:id", verificarToken, verificarRol(2, 3), articulosController.eliminar);

module.exports = router;
