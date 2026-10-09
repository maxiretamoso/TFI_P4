const express = require("express");
const router = express.Router();
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");
const { body } = require("express-validator");
const areasController = require("../controllers/areas.controller");

/**
 * @swagger
 * tags:
 *   name: Areas
 *   description: BREAD de áreas
 */

/**
 * @swagger
 * /api/v1/areas:
 *   get:
 *     summary: Listar áreas activas
 *     tags: [Areas]
 *   post:
 *     summary: Crear área (rol 2/3)
 *     tags: [Areas]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/", areasController.listar);

/**
 * @swagger
 * /api/v1/areas/{id}:
 *   get:
 *     summary: Obtener área
 *     tags: [Areas]
 *   put:
 *     summary: Editar área (rol 2/3)
 *     tags: [Areas]
 *     security: [{ bearerAuth: [] }]
 *   delete:
 *     summary: Soft delete de área
 *     tags: [Areas]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/:id", areasController.obtenerPorId);

router.post("/", verificarToken, verificarRol(2,3), [body("descripcion").isString().trim().isLength({ min:1,max:100 })], areasController.crear);

router.put("/:id", verificarToken, verificarRol(2,3), [body("descripcion").isString().trim().isLength({ min:1,max:100 })], areasController.actualizar);

router.delete("/:id", verificarToken, verificarRol(2,3), areasController.eliminar);

module.exports = router;
