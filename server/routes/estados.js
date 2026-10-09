const express = require("express");
const router = express.Router();
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");
const { body } = require("express-validator");
const estadosController = require("../controllers/estados.controller");

/**
 * @swagger
 * tags:
 *   name: Estados
 *   description: BREAD de estados de incidencia
 */

/**
 * @swagger
 * /api/v1/estados:
 *   get:
 *     summary: Listar estados activos
 *     tags: [Estados]
 *   post:
 *     summary: Crear estado (rol 2/3)
 *     tags: [Estados]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/", estadosController.listar);

/**
 * @swagger
 * /api/v1/estados/{id}:
 *   get:
 *     summary: Obtener estado
 *     tags: [Estados]
 *   put:
 *     summary: Editar estado (rol 2/3)
 *     tags: [Estados]
 *     security: [{ bearerAuth: [] }]
 *   delete:
 *     summary: Soft delete de estado
 *     tags: [Estados]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/:id", estadosController.obtenerPorId);

router.post("/", verificarToken, verificarRol(2,3), [body("descripcion").isString().trim().isLength({min:1,max:100})], estadosController.crear);

router.put("/:id", verificarToken, verificarRol(2,3), [body("descripcion").isString().trim().isLength({min:1,max:100})], estadosController.actualizar);

router.delete("/:id", verificarToken, verificarRol(2,3), estadosController.eliminar);

module.exports = router;
