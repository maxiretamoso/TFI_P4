const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/health -> Health check sin auth, verifica conexión a DB
router.get("/", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: "conectada",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      database: "desconectada",
      error: error.message,
    });
  }
});

module.exports = router;
