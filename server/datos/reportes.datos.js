const pool = require("../db");

function totalesPorEstado() {
  return pool
    .query(`SELECT estados.descripcion AS estado, COUNT(*)::int AS total
            FROM incidencias
            JOIN estados ON incidencias.id_estado = estados.id_estado
            GROUP BY estados.descripcion
            ORDER BY total DESC`)
    .then((r) => r.rows);
}

function totalesPorPrioridad() {
  return pool
    .query(`SELECT prioridad, COUNT(*)::int AS total
            FROM incidencias
            GROUP BY prioridad
            ORDER BY prioridad`)
    .then((r) => r.rows);
}

function totalesPorArea() {
  return pool
    .query(`SELECT areas.id_area, areas.descripcion AS area, COUNT(*)::int AS total
            FROM incidencias
            JOIN articulos ON incidencias.id_articulo = articulos.id_articulo
            JOIN areas     ON articulos.id_area = areas.id_area
            GROUP BY areas.id_area, areas.descripcion
            ORDER BY total DESC`)
    .then((r) => r.rows);
}

function detalle() {
  return pool
    .query(`SELECT incidencias.id_incidencia,
                   incidencias.creado,
                   incidencias.prioridad,
                   incidencias.descripcion_pedido,
                   articulos.descripcion AS articulo,
                   estados.descripcion   AS estado,
                   asignado.apellidos    AS asignado_apellidos,
                   asignado.nombres      AS asignado_nombres
            FROM incidencias
            JOIN articulos ON incidencias.id_articulo = articulos.id_articulo
            JOIN estados   ON incidencias.id_estado = estados.id_estado
            JOIN usuarios AS asignado ON incidencias.asignado_a = asignado.id_usuario
            ORDER BY incidencias.id_incidencia DESC`)
    .then((r) => r.rows);
}

module.exports = { totalesPorEstado, totalesPorPrioridad, totalesPorArea, detalle };
