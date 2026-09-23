const pool = require("../db");

async function listarEstados() {
  const r = await pool.query("SELECT * FROM estados WHERE activo=1 ORDER BY descripcion");
  return r.rows;
}

async function obtenerEstadoPorId(id) {
  const r = await pool.query("SELECT * FROM estados WHERE id_estado=$1", [id]);
  return r.rows[0] || null;
}

async function crearEstado(descripcion) {
  const r = await pool.query(`INSERT INTO estados (descripcion, activo) VALUES ($1,1) RETURNING *`, [descripcion]);
  return r.rows[0];
}

async function actualizarEstado(id, descripcion) {
  const r = await pool.query(`UPDATE estados SET descripcion=$1 WHERE id_estado=$2 RETURNING *`, [descripcion, id]);
  return r.rows[0] || null;
}

async function desactivarEstado(id) {
  const r = await pool.query(`UPDATE estados SET activo=0 WHERE id_estado=$1 RETURNING *`, [id]);
  return r.rows[0] || null;
}

module.exports = { listarEstados, obtenerEstadoPorId, crearEstado, actualizarEstado, desactivarEstado };
