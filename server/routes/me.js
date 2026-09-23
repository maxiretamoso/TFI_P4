const express = require("express");
const router = express.Router();
const verificarToken = require("../middlewares/verificarToken");
const meController = require("../controllers/me.controller");

// GET /api/me -> Devuelve el perfil del usuario autenticado (usa el id del JWT)
router.get("/", verificarToken, meController.obtenerPerfil);

module.exports = router;
