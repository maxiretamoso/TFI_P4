import pool from "../db/index.js";

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

export { listar, buscarPorId };
