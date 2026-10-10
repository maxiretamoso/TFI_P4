const pool = require("../db");
const { crearError } = require("../utils/httpError");

async function listarAreas() {
  const r = await pool.query("SELECT * FROM areas WHERE activo=1 ORDER BY descripcion");
  return r.rows;
}

async function obtenerAreaPorId(id) {
  const r = await pool.query("SELECT * FROM areas WHERE id_area=$1", [id]);
  if (r.rows.length === 0) throw crearError(404, "Área no encontrada");
  return r.rows[0];
}

async function crearArea(descripcion) {
  const r = await pool.query(`INSERT INTO areas (descripcion, activo) VALUES ($1,1) RETURNING *`, [descripcion]);
  return r.rows[0];
}

async function actualizarArea(id, descripcion) {
  const r = await pool.query(`UPDATE areas SET descripcion=$1 WHERE id_area=$2 RETURNING *`, [descripcion, id]);
  if (r.rows.length === 0) throw crearError(404, "Área no encontrada");
  return r.rows[0];
}

async function desactivarArea(id) {
  const r = await pool.query(`UPDATE areas SET activo=0 WHERE id_area=$1 RETURNING *`, [id]);
  if (r.rows.length === 0) throw crearError(404, "Área no encontrada");
  return r.rows[0];
}

module.exports = { listarAreas, obtenerAreaPorId, crearArea, actualizarArea, desactivarArea };
