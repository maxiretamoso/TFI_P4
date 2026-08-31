const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/incidencias_estados -> Historial de cambios de estado de las incidencias
router.get("/", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        incidencias_estados.id_pedidos_estados,
        incidencias_estados.id_incidencia,
        incidencias_estados.fecha_hora_estado,
        estados.descripcion AS estado,
        incidencias.descripcion_pedido AS incidencia
      FROM incidencias_estados
      JOIN incidencias ON incidencias_estados.id_incidencia = incidencias.id_incidencia
      JOIN estados ON incidencias_estados.id_estado = estados.id_estado
      ORDER BY incidencias_estados.id_incidencia, incidencias_estados.fecha_hora_estado
    `);
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Error al obtener el historial de incidencias" });
  }
});

module.exports = router;
