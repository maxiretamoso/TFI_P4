const pool = require("../db");

// Sin estados se incluyen todas las incidencias.
function filtroPorEstados(estados) {
  return estados
    ? { where: "WHERE incidencias.id_estado = ANY($1)", valores: [estados] }
    : { where: "", valores: [] };
}

function totalesPorEstado(estados) {
  const { where, valores } = filtroPorEstados(estados);
  return pool
    .query(`SELECT estados.id_estado, estados.descripcion AS estado, COUNT(*)::int AS total
            FROM incidencias
            JOIN estados ON incidencias.id_estado = estados.id_estado
            ${where}
            GROUP BY estados.id_estado, estados.descripcion
            ORDER BY estados.id_estado`, valores)
    .then((r) => r.rows);
}

function totalesPorPrioridad(estados) {
  const { where, valores } = filtroPorEstados(estados);
  return pool
    .query(`SELECT prioridad, COUNT(*)::int AS total
            FROM incidencias
            ${where}
            GROUP BY prioridad
            ORDER BY prioridad`, valores)
    .then((r) => r.rows);
}

function totalesPorArea(estados) {
  const { where, valores } = filtroPorEstados(estados);
  return pool
    .query(`SELECT areas.id_area, areas.descripcion AS area, COUNT(*)::int AS total
            FROM incidencias
            JOIN articulos ON incidencias.id_articulo = articulos.id_articulo
            JOIN areas     ON articulos.id_area = areas.id_area
            ${where}
            GROUP BY areas.id_area, areas.descripcion
            ORDER BY total DESC`, valores)
    .then((r) => r.rows);
}

function detalle(estados) {
  const { where, valores } = filtroPorEstados(estados);
  return pool
    .query(`SELECT incidencias.id_incidencia,
                   incidencias.creado,
                   incidencias.prioridad,
                   incidencias.id_estado,
                   incidencias.descripcion_pedido,
                   articulos.descripcion AS articulo,
                   estados.descripcion   AS estado,
                   asignado.apellidos    AS asignado_apellidos,
                   asignado.nombres      AS asignado_nombres
            FROM incidencias
            JOIN articulos ON incidencias.id_articulo = articulos.id_articulo
            JOIN estados   ON incidencias.id_estado = estados.id_estado
            JOIN usuarios AS asignado ON incidencias.asignado_a = asignado.id_usuario
            ${where}
            ORDER BY incidencias.id_incidencia DESC`, valores)
    .then((r) => r.rows);
}

module.exports = { totalesPorEstado, totalesPorPrioridad, totalesPorArea, detalle };
