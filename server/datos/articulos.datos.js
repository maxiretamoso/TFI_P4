const pool = require("../db");

function listar() {
  return pool
    .query(`SELECT articulos.id_articulo,
                   articulos.descripcion,
                   articulos.activo,
                   articulos.id_area,
                   articulos.id_categoria,
                   areas.descripcion      AS area,
                   categorias.descripcion AS categoria
            FROM articulos
            JOIN areas      ON articulos.id_area = areas.id_area
            JOIN categorias ON articulos.id_categoria = categorias.id_categoria
            WHERE articulos.activo = 1
            ORDER BY articulos.descripcion`)
    .then((r) => r.rows);
}

function buscarPorId(id) {
  return pool
    .query(`SELECT id_articulo, id_area, id_categoria, descripcion, activo
            FROM articulos
            WHERE id_articulo = $1`, [id])
    .then((r) => r.rows[0] || null);
}

function insertar({ id_area, id_categoria, descripcion }) {
  return pool
    .query(`INSERT INTO articulos (id_area, id_categoria, descripcion, activo)
            VALUES ($1, $2, $3, 1) RETURNING *`, [id_area, id_categoria, descripcion])
    .then((r) => r.rows[0]);
}

function actualizar(id, { id_area, id_categoria, descripcion }) {
  return pool
    .query(`UPDATE articulos
            SET id_area = $1, id_categoria = $2, descripcion = $3
            WHERE id_articulo = $4 RETURNING *`, [id_area, id_categoria, descripcion, id])
    .then((r) => r.rows[0] || null);
}

function desactivar(id) {
  return pool
    .query(`UPDATE articulos SET activo = 0 WHERE id_articulo = $1 RETURNING *`, [id])
    .then((r) => r.rows[0] || null);
}

module.exports = { listar, buscarPorId, insertar, actualizar, desactivar };
