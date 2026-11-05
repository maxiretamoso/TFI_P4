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
            WHERE creado::date > current_date - $1::int
            GROUP BY creado::date
            ORDER BY creado::date`, [dias])
    .then((r) => r.rows);
}

function total() {
  return pool
    .query(`SELECT COUNT(*)::int AS total FROM incidencias`)
    .then((r) => r.rows[0].total);
}

module.exports = { totalesPorEstado, totalesPorFecha, total };
