const pool = require("../db");

function listar() {
  return pool
    .query(`SELECT id_estado, descripcion, activo
            FROM estados
            WHERE activo = 1
            ORDER BY id_estado`)
    .then((r) => r.rows);
}

function buscarPorId(id) {
  return pool
    .query(`SELECT id_estado, descripcion, activo FROM estados WHERE id_estado = $1`, [id])
    .then((r) => r.rows[0] || null);
}

function insertar(descripcion) {
  return pool
    .query(`INSERT INTO estados (descripcion, activo) VALUES ($1, 1) RETURNING *`, [descripcion])
    .then((r) => r.rows[0]);
}

function actualizar(id, descripcion) {
  return pool
    .query(`UPDATE estados SET descripcion = $1 WHERE id_estado = $2 RETURNING *`, [descripcion, id])
    .then((r) => r.rows[0] || null);
}

function desactivar(id) {
  return pool
    .query(`UPDATE estados SET activo = 0 WHERE id_estado = $1 RETURNING *`, [id])
    .then((r) => r.rows[0] || null);
}

module.exports = { listar, buscarPorId, insertar, actualizar, desactivar };
