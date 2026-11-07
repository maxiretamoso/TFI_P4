import pool from "../db/index.js";

function listar() {
  return pool
    .query(`SELECT id_categoria, descripcion, activo
            FROM categorias
            WHERE activo = 1
            ORDER BY descripcion`)
    .then((r) => r.rows);
}

function buscarPorId(id) {
  return pool
    .query(`SELECT id_categoria, descripcion, activo FROM categorias WHERE id_categoria = $1`, [id])
    .then((r) => r.rows[0] || null);
}

function insertar(descripcion) {
  return pool
    .query(`INSERT INTO categorias (descripcion, activo) VALUES ($1, 1) RETURNING *`, [descripcion])
    .then((r) => r.rows[0]);
}

function actualizar(id, descripcion) {
  return pool
    .query(`UPDATE categorias SET descripcion = $1 WHERE id_categoria = $2 RETURNING *`, [descripcion, id])
    .then((r) => r.rows[0] || null);
}

function desactivar(id) {
  return pool
    .query(`UPDATE categorias SET activo = 0 WHERE id_categoria = $1 RETURNING *`, [id])
    .then((r) => r.rows[0] || null);
}

function contarArticulos(id) {
  return pool
    .query(`SELECT COUNT(*)::int AS total FROM articulos WHERE id_categoria = $1 AND activo = 1`, [id])
    .then((r) => r.rows[0].total);
}

export { listar, buscarPorId, insertar, actualizar, desactivar, contarArticulos };
