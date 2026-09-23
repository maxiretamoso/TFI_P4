const express = require("express");
const router = express.Router();
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");
const { body } = require("express-validator");
const estadosController = require("../controllers/estados.controller");

router.get("/", estadosController.listar);

router.get("/:id", estadosController.obtenerPorId);

router.post("/", verificarToken, verificarRol(2,3), [body("descripcion").isString().trim().isLength({min:1,max:100})], estadosController.crear);

router.put("/:id", verificarToken, verificarRol(2,3), [body("descripcion").isString().trim().isLength({min:1,max:100})], estadosController.actualizar);

router.delete("/:id", verificarToken, verificarRol(2,3), estadosController.eliminar);

module.exports = router;
