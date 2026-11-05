import express from "express";
import verificarToken from "../middlewares/verificarToken.js";
import * as meController from "../controllers/me.controller.js";

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

export default router;
