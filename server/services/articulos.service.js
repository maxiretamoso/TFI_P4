const pool = require("../db");
const { crearError } = require("../utils/httpError");

async function listarArticulos() {
  const r = await pool.query(`
      SELECT articulos.id_articulo, articulos.descripcion, articulos.activo,
             areas.descripcion AS area, categorias.descripcion AS categoria,
             articulos.id_area, articulos.id_categoria
      FROM articulos
      JOIN areas ON articulos.id_area = areas.id_area
      JOIN categorias ON articulos.id_categoria = categorias.id_categoria
      WHERE articulos.activo=1 ORDER BY articulos.descripcion`);
  return r.rows;
}

async function obtenerArticuloPorId(id) {
  const r = await pool.query(`SELECT * FROM articulos WHERE id_articulo=$1`, [id]);
  if (r.rows.length === 0) throw crearError(404, "Artículo no encontrado");
  return r.rows[0];
}

async function crearArticulo({ id_area, id_categoria, descripcion }) {
  const r = await pool.query(
    `INSERT INTO articulos (id_area, descripcion, id_categoria, activo) VALUES ($1,$2,$3,1) RETURNING *`,
    [id_area, descripcion, id_categoria],
  );
  return r.rows[0];
}

async function actualizarArticulo(id, { id_area, id_categoria, descripcion }) {
  const actual = await pool.query(`SELECT * FROM articulos WHERE id_articulo=$1`, [id]);
  if (actual.rows.length === 0) throw crearError(404, "Artículo no encontrado");
  const a = actual.rows[0];
  const r = await pool.query(
    `UPDATE articulos SET id_area=$1, id_categoria=$2, descripcion=$3 WHERE id_articulo=$4 RETURNING *`,
    [id_area ?? a.id_area, id_categoria ?? a.id_categoria, descripcion ?? a.descripcion, id],
  );
  return r.rows[0];
}

async function desactivarArticulo(id) {
  const r = await pool.query(`UPDATE articulos SET activo=0 WHERE id_articulo=$1 RETURNING *`, [id]);
  if (r.rows.length === 0) throw crearError(404, "Artículo no encontrado");
  return r.rows[0];
}

module.exports = {
  listarArticulos,
  obtenerArticuloPorId,
  crearArticulo,
  actualizarArticulo,
  desactivarArticulo,
};
