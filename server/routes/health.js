import express from "express";
import * as healthController from "../controllers/health.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Estado del servidor y de la base
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Comprueba que el servidor responde y la base está conectada
 *     tags: [Health]
 *     responses:
 *       200: { description: Todo en orden }
 *       503: { description: La base no responde }
 */
router.get("/", healthController.verificarSalud);

export default router;
