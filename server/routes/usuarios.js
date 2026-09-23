const express = require("express");
const router = express.Router();
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");
const { body } = require("express-validator");
const usuariosController = require("../controllers/usuarios.controller");
const { uploadAvatar } = require("../utils/avatarUpload");

// Browse (requiere auth: expone nómina de usuarios, ver NOTAS_CORRECCION.md punto 2)
router.get("/", verificarToken, usuariosController.listar);

router.get("/:id", verificarToken, usuariosController.obtenerPorId);

router.post("/",
  verificarToken, verificarRol(3),
  [body("id_area").isInt(), body("nombres").isString().trim().isLength({ min: 1, max: 100 }), body("apellidos").isString().trim().isLength({ min: 1, max: 100 }), body("usuario").isString().trim().isLength({ min: 1, max: 100 }), body("contrasenia").isString().isLength({ min: 6, max: 100 }), body("rol").isInt({ min: 1, max: 3 })],
  usuariosController.crear
);

router.put("/:id",
  verificarToken,
  [body("id_area").optional().isInt(), body("nombres").optional().isString().trim().isLength({ min: 1, max: 100 }), body("apellidos").optional().isString().trim().isLength({ min: 1, max: 100 }), body("usuario").optional().isString().trim().isLength({ min: 1, max: 100 }), body("rol").optional().isInt({ min: 1, max: 3 })],
  usuariosController.actualizar
);

// Soft delete
router.delete("/:id", verificarToken, verificarRol(3), usuariosController.eliminar);

// Avatar upload
router.patch("/:id/avatar", verificarToken, uploadAvatar.single("avatar"), usuariosController.subirAvatar);

module.exports = router;
