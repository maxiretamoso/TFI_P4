const pool = require("../db");
const { crearError } = require("../utils/httpError");

async function listarEstados() {
  const r = await pool.query("SELECT * FROM estados WHERE activo=1 ORDER BY descripcion");
  return r.rows;
}

async function obtenerEstadoPorId(id) {
  const r = await pool.query("SELECT * FROM estados WHERE id_estado=$1", [id]);
  if (r.rows.length === 0) throw crearError(404, "Estado no encontrado");
  return r.rows[0];
}

async function crearEstado(descripcion) {
  const r = await pool.query(`INSERT INTO estados (descripcion, activo) VALUES ($1,1) RETURNING *`, [descripcion]);
  return r.rows[0];
}

async function actualizarEstado(id, descripcion) {
  const r = await pool.query(`UPDATE estados SET descripcion=$1 WHERE id_estado=$2 RETURNING *`, [descripcion, id]);
  if (r.rows.length === 0) throw crearError(404, "Estado no encontrado");
  return r.rows[0];
}

async function desactivarEstado(id) {
  const r = await pool.query(`UPDATE estados SET activo=0 WHERE id_estado=$1 RETURNING *`, [id]);
  if (r.rows.length === 0) throw crearError(404, "Estado no encontrado");
  return r.rows[0];
}

module.exports = { listarEstados, obtenerEstadoPorId, crearEstado, actualizarEstado, desactivarEstado };
