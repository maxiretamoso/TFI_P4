const express = require("express");
const router = express.Router();
const pool = require("../db");
const verificarToken = require("../middlewares/verificarToken");

// GET /api/categorias -> Lista todas las categorías activas
router.get("/", async (req, res) => {
  try {
    const resultado = await pool.query(
      "SELECT * FROM categorias WHERE activo = 1 ORDER BY descripcion",
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener las categorías" });
  }
});

module.exports = router;
