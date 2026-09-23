const express = require("express");
const router = express.Router();
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");
const dashboardController = require("../controllers/dashboard.controller");

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Estadísticas para Director
 */

/**
 * @swagger
 * /api/v1/dashboard:
 *   get:
 *     summary: Totales por estado, por fecha y prioritarias (solo Director)
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/", verificarToken, verificarRol(3), dashboardController.obtenerResumen);

module.exports = router;
