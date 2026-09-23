const pool = require("../db");

async function obtenerResumen() {
  const porEstado = await pool.query(`
      SELECT estados.descripcion AS estado, COUNT(*)::int AS total
      FROM incidencias JOIN estados ON incidencias.id_estado=estados.id_estado
      GROUP BY estados.descripcion ORDER BY estados.descripcion`);
  const porFecha = await pool.query(`
      SELECT to_char(creado::date,'YYYY-MM-DD') AS fecha, COUNT(*)::int AS total
      FROM incidencias GROUP BY creado::date ORDER BY fecha DESC LIMIT 30`);
  const prioritarias = await pool.query(`
      SELECT incidencias.*, estados.descripcion AS estado, articulos.descripcion AS articulo_desc
      FROM incidencias JOIN estados ON incidencias.id_estado=estados.id_estado
      JOIN articulos ON incidencias.id_articulo=articulos.id_articulo
      WHERE prioridad=3 ORDER BY creado DESC LIMIT 20`);
  const total = await pool.query(`SELECT COUNT(*)::int AS total FROM incidencias`);
  return {
    total: total.rows[0].total,
    porEstado: porEstado.rows,
    porFecha: porFecha.rows,
    prioritarias: prioritarias.rows,
  };
}

module.exports = { obtenerResumen };
