const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/incidencias -> Lista todas las incidencias con sus datos relacionados
router.get("/", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        incidencias.id_incidencia,
        incidencias.descripcion_pedido,
        incidencias.descripcion_resolucion,
        incidencias.prioridad,
        incidencias.creado,
        estados.descripcion AS estado,
        articulos.descripcion AS articulo,
        creador.nombres AS creado_por_nombre,
        creador.apellidos AS creado_por_apellido,
        asignado.nombres AS asignado_a_nombre,
        asignado.apellidos AS asignado_a_apellido
      FROM incidencias
      JOIN estados ON incidencias.id_estado = estados.id_estado
      JOIN articulos ON incidencias.articulo = articulos.id_articulo
      JOIN usuarios AS creador ON incidencias.creado_por = creador.id_usuario
      LEFT JOIN usuarios AS asignado ON incidencias.asignado_a = asignado.id_usuario
      ORDER BY incidencias.creado DESC
    `);
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener las incidencias" });
  }
});

module.exports = router;
