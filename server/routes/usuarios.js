const express = require("express");
const router = express.Router();
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");
const { body } = require("express-validator");
const usuariosController = require("../controllers/usuarios.controller");
const { uploadAvatar } = require("../utils/avatarUpload");

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Nómina de usuarios del municipio
 */

/**
 * @swagger
 * /api/v1/usuarios:
 *   get:
 *     summary: Listar usuarios activos (nómina)
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     summary: Crear usuario (rol 3)
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 */
// Browse (requiere auth: expone nómina de usuarios)
router.get("/", verificarToken, usuariosController.listar);

/**
 * @swagger
 * /api/v1/usuarios/{id}:
 *   get:
 *     summary: Obtener usuario
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *   put:
 *     summary: Editar usuario (rol 3, o el propio perfil)
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *   delete:
 *     summary: Soft delete de usuario (rol 3)
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *   patch:
 *     summary: Subir avatar (Multer)
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/:id", verificarToken, usuariosController.obtenerPorId);

router.post("/",
  verificarToken, verificarRol(3),
  [body("id_area").isInt(), body("nombres").isString().trim().isLength({ min: 1, max: 100 }), body("apellidos").isString().trim().isLength({ min: 1, max: 100 }), body("usuario").isString().trim().isLength({ min: 1, max: 100 }), body("contrasenia").isString().isLength({ min: 6, max: 100 }), body("rol").isInt({ min: 1, max: 3 })],
  usuariosController.crear
);

router.put("/:id",
  verificarToken,
  [body("id_area").optional().isInt(), body("nombres").optional().isString().trim().isLength({ min: 1, max: 100 }), body("apellidos").optional().isString().trim().isLength({ min: 1, max: 100 }), body("usuario").optional().isString().trim().isLength({ min: 1, max: 100 }), body("contrasenia").optional().isString().isLength({ min: 6, max: 100 }), body("rol").optional().isInt({ min: 1, max: 3 })],
  usuariosController.actualizar
);

// Soft delete
router.delete("/:id", verificarToken, verificarRol(3), usuariosController.eliminar);

// Avatar upload
router.patch("/:id/avatar", verificarToken, uploadAvatar.single("avatar"), usuariosController.subirAvatar);

module.exports = router;
