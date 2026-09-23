const pool = require("../db");

async function listarHistorial() {
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
  return resultado.rows;
}

module.exports = { listarHistorial };
