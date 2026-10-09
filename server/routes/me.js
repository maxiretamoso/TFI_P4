const express = require("express");
const router = express.Router();
const verificarToken = require("../middlewares/verificarToken");
const meController = require("../controllers/me.controller");

/**
 * @swagger
 * tags:
 *   name: Me
 *   description: Perfil del usuario autenticado
 */

/**
 * @swagger
 * /api/v1/me:
 *   get:
 *     summary: Perfil del usuario autenticado (usa el id del JWT)
 *     tags: [Me]
 *     security: [{ bearerAuth: [] }]
 */
// GET /api/v1/me -> Devuelve el perfil del usuario autenticado (usa el id del JWT)
router.get("/", verificarToken, meController.obtenerPerfil);

module.exports = router;
