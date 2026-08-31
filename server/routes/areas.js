const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/areas -> Lista todas las áreas activas
router.get("/", async (req, res) => {
  try {
    const resultado = await pool.query(
      "SELECT * FROM areas WHERE activo = 1 ORDER BY descripcion",
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener las áreas" });
  }
});

module.exports = router;
