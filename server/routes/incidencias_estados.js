const express = require("express");
const router = express.Router();
const incidenciasEstadosController = require("../controllers/incidencias_estados.controller");

// GET /api/incidencias_estados -> Historial de cambios de estado de las incidencias
router.get("/", incidenciasEstadosController.listar);

module.exports = router;
