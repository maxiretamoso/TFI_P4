const express = require("express");
const router = express.Router();
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");
const { body } = require("express-validator");
const categoriasController = require("../controllers/categorias.controller");

/**
 * @swagger
 * tags:
 *   name: Categorias
 *   description: BREAD de categorías
 */

/**
 * @swagger
 * /api/v1/categorias:
 *   get:
 *     summary: Listar categorías activas
 *     tags: [Categorias]
 *   post:
 *     summary: Crear categoría (rol 2/3)
 *     tags: [Categorias]
 *     security: [{ bearerAuth: [] }]
 */
// GET /api/v1/categorias -> lista activas (Browse)
router.get("/", categoriasController.listar);

/**
 * @swagger
 * /api/v1/categorias/{id}:
 *   get:
 *     summary: Obtener categoría
 *     tags: [Categorias]
 *   put:
 *     summary: Editar categoría (rol 2/3)
 *     tags: [Categorias]
 *     security: [{ bearerAuth: [] }]
 *   delete:
 *     summary: Soft delete categoría
 *     tags: [Categorias]
 *     security: [{ bearerAuth: [] }]
 */
// GET /:id -> Read
router.get("/:id", categoriasController.obtenerPorId);

// POST / -> Add (solo sistemas 2 y director 3)
router.post("/", verificarToken, verificarRol(2, 3), [body("descripcion").isString().trim().isLength({ min: 1, max: 100 })], categoriasController.crear);

// PUT /:id -> Edit
router.put("/:id", verificarToken, verificarRol(2, 3), [body("descripcion").isString().trim().isLength({ min: 1, max: 100 })], categoriasController.actualizar);

// DELETE /:id -> soft delete activo=false
router.delete("/:id", verificarToken, verificarRol(2, 3), categoriasController.eliminar);

module.exports = router;
