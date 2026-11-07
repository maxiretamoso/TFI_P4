import pool from "../db/index.js";

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

function totalesPorFecha(limite) {
  return pool
    .query(`SELECT to_char(creado::date, 'YYYY-MM-DD') AS fecha,
                   COUNT(*)::int AS total
            FROM incidencias
            GROUP BY creado::date
            ORDER BY creado::date DESC
            LIMIT $1`, [limite])
    .then((r) => r.rows);
}

function total() {
  return pool
    .query(`SELECT COUNT(*)::int AS total FROM incidencias`)
    .then((r) => r.rows[0].total);
}

function indicadores({ abiertos, pendiente, rolDirector }) {
  return pool
    .query(`SELECT COUNT(*) FILTER (WHERE id_estado = ANY($1))::int AS abiertas,
                   COUNT(*) FILTER (WHERE creado >= current_date - 6)::int AS ultimos_7_dias,
                   COUNT(*) FILTER (
                     WHERE id_estado = $2
                       AND asignado_a IN (SELECT id_usuario FROM usuarios WHERE rol = $3)
                   )::int AS sin_asignar
            FROM incidencias`, [abiertos, pendiente, rolDirector])
    .then((r) => r.rows[0]);
}

function prioritarias({ prioridad, abiertos, limite }) {
  return pool
    .query(`SELECT incidencias.id_incidencia,
                   incidencias.descripcion_pedido,
                   incidencias.creado,
                   incidencias.id_estado,
                   estados.descripcion   AS estado,
                   articulos.descripcion AS articulo,
                   asignado.nombres      AS asignado_nombres,
                   asignado.apellidos    AS asignado_apellidos,
                   creador.nombres       AS creador_nombres,
                   creador.apellidos     AS creador_apellidos
            FROM incidencias
            JOIN estados   ON incidencias.id_estado = estados.id_estado
            JOIN articulos ON incidencias.id_articulo = articulos.id_articulo
            JOIN usuarios AS asignado ON incidencias.asignado_a = asignado.id_usuario
            JOIN usuarios AS creador  ON incidencias.creado_por = creador.id_usuario
            WHERE incidencias.prioridad = $1 AND incidencias.id_estado = ANY($2)
            ORDER BY incidencias.creado
            LIMIT $3`, [prioridad, abiertos, limite])
    .then((r) => r.rows);
}

function cargaPorEmpleado({ rolSistemas, abiertos, resuelta }) {
  return pool
    .query(`SELECT usuarios.id_usuario,
                   usuarios.nombres,
                   usuarios.apellidos,
                   COUNT(incidencias.id_incidencia) FILTER (WHERE incidencias.id_estado = ANY($2))::int AS abiertas,
                   COUNT(incidencias.id_incidencia) FILTER (WHERE incidencias.id_estado = $3)::int AS resueltas
            FROM usuarios
            LEFT JOIN incidencias ON incidencias.asignado_a = usuarios.id_usuario
            WHERE usuarios.rol = $1 AND usuarios.activo = 1
            GROUP BY usuarios.id_usuario, usuarios.nombres, usuarios.apellidos
            ORDER BY abiertas DESC, usuarios.apellidos`, [rolSistemas, abiertos, resuelta])
    .then((r) => r.rows);
}

function totalesPorCategoria() {
  return pool
    .query(`SELECT categorias.id_categoria, categorias.descripcion AS categoria, COUNT(*)::int AS total
            FROM incidencias
            JOIN articulos  ON incidencias.id_articulo = articulos.id_articulo
            JOIN categorias ON articulos.id_categoria = categorias.id_categoria
            GROUP BY categorias.id_categoria, categorias.descripcion
            ORDER BY total DESC`)
    .then((r) => r.rows);
}

export {
  totalesPorEstado,
  totalesPorFecha,
  total,
  indicadores,
  prioritarias,
  cargaPorEmpleado,
  totalesPorCategoria,
};
