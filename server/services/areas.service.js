const pool = require("../db");

async function listarAreas() {
  const r = await pool.query("SELECT * FROM areas WHERE activo=1 ORDER BY descripcion");
  return r.rows;
}

async function obtenerAreaPorId(id) {
  const r = await pool.query("SELECT * FROM areas WHERE id_area=$1", [id]);
  return r.rows[0] || null;
}

async function crearArea(descripcion) {
  const r = await pool.query(`INSERT INTO areas (descripcion, activo) VALUES ($1,1) RETURNING *`, [descripcion]);
  return r.rows[0];
}

async function actualizarArea(id, descripcion) {
  const r = await pool.query(`UPDATE areas SET descripcion=$1 WHERE id_area=$2 RETURNING *`, [descripcion, id]);
  return r.rows[0] || null;
}

async function desactivarArea(id) {
  const r = await pool.query(`UPDATE areas SET activo=0 WHERE id_area=$1 RETURNING *`, [id]);
  return r.rows[0] || null;
}

module.exports = { listarAreas, obtenerAreaPorId, crearArea, actualizarArea, desactivarArea };
