const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/estados -> Lista todos los estados activos
router.get("/", async (req, res) => {
  try {
    const resultado = await pool.query(
      "SELECT * FROM estados WHERE activo = 1 ORDER BY descripcion",
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los estados" });
  }
});

module.exports = router;
