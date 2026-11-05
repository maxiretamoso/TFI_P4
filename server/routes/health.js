const express = require("express");
const healthController = require("../controllers/health.controller");

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

module.exports = router;
