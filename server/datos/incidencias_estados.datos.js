import pool from "../db/index.js";

function listar() {
  return pool
    .query(`SELECT incidencias_estados.id_pedidos_estados,
                   incidencias_estados.id_incidencia,
                   incidencias_estados.fecha_hora_estado,
                   estados.descripcion            AS estado,
                   incidencias.descripcion_pedido AS incidencia
            FROM incidencias_estados
            JOIN incidencias ON incidencias_estados.id_incidencia = incidencias.id_incidencia
            JOIN estados     ON incidencias_estados.id_estado = estados.id_estado
            ORDER BY incidencias_estados.id_incidencia, incidencias_estados.id_pedidos_estados`)
    .then((r) => r.rows);
}

function listarPorIncidencia(idIncidencia) {
  return pool
    .query(`SELECT incidencias_estados.id_pedidos_estados,
                   incidencias_estados.id_estado,
                   incidencias_estados.fecha_hora_estado,
                   estados.descripcion AS estado
            FROM incidencias_estados
            JOIN estados ON incidencias_estados.id_estado = estados.id_estado
            WHERE incidencias_estados.id_incidencia = $1
            ORDER BY incidencias_estados.id_pedidos_estados`, [idIncidencia])
    .then((r) => r.rows);
}

export { listar, listarPorIncidencia };
