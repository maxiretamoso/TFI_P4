const pool = require("../db");

async function obtenerDatosReporte() {
  const porEstado = await pool.query(`
      SELECT estados.descripcion AS estado, COUNT(*)::int AS total
      FROM incidencias JOIN estados ON incidencias.id_estado=estados.id_estado
      GROUP BY estados.descripcion ORDER BY total DESC`);
  const porPrioridad = await pool.query(
    `SELECT prioridad, COUNT(*)::int AS total FROM incidencias GROUP BY prioridad ORDER BY prioridad`,
  );
  const porArea = await pool.query(`
      SELECT areas.descripcion AS area, COUNT(*)::int AS total
      FROM incidencias JOIN articulos ON incidencias.id_articulo=articulos.id_articulo JOIN areas ON articulos.id_area=areas.id_area
      GROUP BY areas.descripcion`);
  return { porEstado: porEstado.rows, porPrioridad: porPrioridad.rows, porArea: porArea.rows };
}

module.exports = { obtenerDatosReporte };
