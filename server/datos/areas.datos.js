import pool from "../db/index.js";

function listar() {
  return pool
    .query(`SELECT id_area, descripcion, activo
            FROM areas
            WHERE activo = 1
            ORDER BY descripcion`)
    .then((r) => r.rows);
}

function buscarPorId(id) {
  return pool
    .query(`SELECT id_area, descripcion, activo FROM areas WHERE id_area = $1`, [id])
    .then((r) => r.rows[0] || null);
}

function insertar(descripcion) {
  return pool
    .query(`INSERT INTO areas (descripcion, activo) VALUES ($1, 1) RETURNING *`, [descripcion])
    .then((r) => r.rows[0]);
}

function actualizar(id, descripcion) {
  return pool
    .query(`UPDATE areas SET descripcion = $1 WHERE id_area = $2 RETURNING *`, [descripcion, id])
    .then((r) => r.rows[0] || null);
}

function desactivar(id) {
  return pool
    .query(`UPDATE areas SET activo = 0 WHERE id_area = $1 RETURNING *`, [id])
    .then((r) => r.rows[0] || null);
}

export { listar, buscarPorId, insertar, actualizar, desactivar };
