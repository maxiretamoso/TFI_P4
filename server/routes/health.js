const express = require("express");
const router = express.Router();
const healthController = require("../controllers/health.controller");

// GET /api/health -> Health check sin auth, verifica conexión a DB
router.get("/", healthController.verificarSalud);

module.exports = router;
