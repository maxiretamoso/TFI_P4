const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/articulos -> Lista todos los artículos activos, con su área y categoría
router.get("/", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT 
        articulos.id_articulo,
        articulos.descripcion,
        articulos.activo,
        areas.descripcion AS area,
        categorias.descripcion AS categoria
      FROM articulos
      JOIN areas ON articulos.id_area = areas.id_area
      JOIN categorias ON articulos.categoria = categorias.id_categoria
      WHERE articulos.activo = 1
      ORDER BY articulos.descripcion
    `);
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los artículos" });
  }
});

module.exports = router;
