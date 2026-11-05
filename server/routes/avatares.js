import express from "express";
import verificarToken from "../middlewares/verificarToken.js";
import * as avataresController from "../controllers/avatares.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Avatares
 *   description: Avatares predefinidos que se pueden elegir como foto de perfil
 */

/**
 * @swagger
 * /avatares:
 *   get:
 *     summary: Lista los avatares predefinidos
 *     description: La imagen de cada uno se sirve en /publico/avatares/{avatar}.
 *     tags: [Avatares]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Avatares disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:     { type: string, example: caricatura-01 }
 *                   avatar: { type: string, example: predefinidos/caricatura-01.svg }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 */
router.get("/", verificarToken, avataresController.listar);

export default router;
