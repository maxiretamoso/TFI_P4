const express = require("express");
const verificarToken = require("../middlewares/verificarToken");
const meController = require("../controllers/me.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Perfil
 *   description: Datos del usuario autenticado
 */

/**
 * @swagger
 * /me:
 *   get:
 *     summary: Devuelve el perfil del usuario del token
 *     tags: [Perfil]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Usuario' }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 */
router.get("/", verificarToken, meController.obtenerPerfil);

module.exports = router;
