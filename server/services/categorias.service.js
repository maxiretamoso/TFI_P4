const pool = require("../db");
const { crearError } = require("../utils/httpError");

async function listarCategorias() {
  const r = await pool.query("SELECT * FROM categorias WHERE activo=1 ORDER BY descripcion");
  return r.rows;
}

async function obtenerCategoriaPorId(id) {
  const r = await pool.query("SELECT * FROM categorias WHERE id_categoria=$1", [id]);
  if (r.rows.length === 0) throw crearError(404, "Categoría no encontrada");
  return r.rows[0];
}

async function crearCategoria(descripcion) {
  const r = await pool.query(`INSERT INTO categorias (descripcion, activo) VALUES ($1,1) RETURNING *`, [descripcion]);
  return r.rows[0];
}

async function actualizarCategoria(id, descripcion) {
  const r = await pool.query(`UPDATE categorias SET descripcion=$1 WHERE id_categoria=$2 RETURNING *`, [descripcion, id]);
  if (r.rows.length === 0) throw crearError(404, "Categoría no encontrada");
  return r.rows[0];
}

async function desactivarCategoria(id) {
  const r = await pool.query(`UPDATE categorias SET activo=0 WHERE id_categoria=$1 RETURNING *`, [id]);
  if (r.rows.length === 0) throw crearError(404, "Categoría no encontrada");
  return r.rows[0];
}

module.exports = { listarCategorias, obtenerCategoriaPorId, crearCategoria, actualizarCategoria, desactivarCategoria };
