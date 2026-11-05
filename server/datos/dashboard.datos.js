const pool = require("../db");

function totalesPorEstado() {
  return pool
    .query(`SELECT estados.id_estado,
                   estados.descripcion AS estado,
                   COUNT(incidencias.id_incidencia)::int AS total
            FROM estados
            LEFT JOIN incidencias ON incidencias.id_estado = estados.id_estado
            WHERE estados.activo = 1
            GROUP BY estados.id_estado, estados.descripcion
            ORDER BY estados.id_estado`)
    .then((r) => r.rows);
}

function totalesPorFecha(dias) {
  return pool
    .query(`SELECT to_char(creado::date, 'YYYY-MM-DD') AS fecha,
                   COUNT(*)::int AS total
            FROM incidencias
            GROUP BY creado::date
            ORDER BY creado::date DESC
            LIMIT $1`, [dias])
    .then((r) => r.rows);
}

function prioritarias(prioridad, limite) {
  return pool
    .query(`SELECT incidencias.id_incidencia,
                   incidencias.descripcion_pedido,
                   incidencias.prioridad,
                   incidencias.creado,
                   incidencias.id_estado,
                   estados.descripcion   AS estado,
                   articulos.descripcion AS articulo_descripcion,
                   asignado.nombres      AS asignado_a_nombre,
                   asignado.apellidos    AS asignado_a_apellido
            FROM incidencias
            JOIN estados   ON incidencias.id_estado = estados.id_estado
            JOIN articulos ON incidencias.id_articulo = articulos.id_articulo
            JOIN usuarios AS asignado ON incidencias.asignado_a = asignado.id_usuario
            WHERE incidencias.prioridad = $1
            ORDER BY incidencias.creado DESC
            LIMIT $2`, [prioridad, limite])
    .then((r) => r.rows);
}

function total() {
  return pool
    .query(`SELECT COUNT(*)::int AS total FROM incidencias`)
    .then((r) => r.rows[0].total);
}

module.exports = { totalesPorEstado, totalesPorFecha, prioritarias, total };
