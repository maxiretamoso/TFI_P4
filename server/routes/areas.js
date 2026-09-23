const express = require("express");
const router = express.Router();
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");
const { body } = require("express-validator");
const areasController = require("../controllers/areas.controller");
/**
  rutas para la gestión de áreas. Todas las rutas requieren autenticación y autorización según el rol del usuario.
 */
router.get("/", areasController.listar);

router.get("/:id", areasController.obtenerPorId);

router.post("/", verificarToken, verificarRol(2,3), [body("descripcion").isString().trim().isLength({ min:1,max:100 })], areasController.crear);

router.put("/:id", verificarToken, verificarRol(2,3), [body("descripcion").isString().trim().isLength({ min:1,max:100 })], areasController.actualizar);

router.delete("/:id", verificarToken, verificarRol(2,3), areasController.eliminar);

module.exports = router;
