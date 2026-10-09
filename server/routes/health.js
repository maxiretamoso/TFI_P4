const express = require("express");
const router = express.Router();
const healthController = require("../controllers/health.controller");

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Estado del servidor y de la base de datos
 */

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check sin autenticación
 *     tags: [Health]
 */
// GET /api/v1/health -> Health check sin auth, verifica conexión a DB
router.get("/", healthController.verificarSalud);

module.exports = router;
