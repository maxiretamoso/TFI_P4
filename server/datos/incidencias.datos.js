import pool from "../db/index.js";
import { conTransaccion } from "../utils/transaccion.js";

const DESDE = `
  FROM incidencias
  JOIN estados        ON incidencias.id_estado = estados.id_estado
  JOIN articulos      ON incidencias.id_articulo = articulos.id_articulo
  JOIN usuarios AS creador  ON incidencias.creado_por = creador.id_usuario
  JOIN usuarios AS asignado ON incidencias.asignado_a = asignado.id_usuario
`;

const SELECCION = `
  SELECT incidencias.id_incidencia,
         incidencias.descripcion_pedido,
         incidencias.descripcion_resolucion,
         incidencias.prioridad,
         incidencias.creado,
         incidencias.creado_por,
         incidencias.asignado_a,
         incidencias.id_articulo,
         incidencias.id_estado,
         estados.descripcion   AS estado,
         articulos.descripcion AS articulo_descripcion,
         creador.nombres       AS creado_por_nombre,
         creador.apellidos     AS creado_por_apellido,
         asignado.nombres      AS asignado_a_nombre,
         asignado.apellidos    AS asignado_a_apellido
  ${DESDE}
`;

function armarFiltros({
  creadoPor,
  asignadoA,
  estados,
  prioridad,
  buscar,
  desde,
  fecha,
  sinAsignar,
  pendiente,
  rolDirector,
  area,
  categoria,
  asignado,
}) {
  const condiciones = [];
  const valores = [];

  if (creadoPor) {
    valores.push(creadoPor);
    condiciones.push(`incidencias.creado_por = $${valores.length}`);
  }
  if (asignadoA) {
    valores.push(asignadoA);
    condiciones.push(`incidencias.asignado_a = $${valores.length}`);
  }
  if (estados) {
    valores.push(estados);
    condiciones.push(`incidencias.id_estado = ANY($${valores.length})`);
  }
  if (prioridad) {
    valores.push(prioridad);
    condiciones.push(`incidencias.prioridad = $${valores.length}`);
  }
  if (buscar) {
    valores.push(`%${buscar}%`);
    condiciones.push(
      `(incidencias.descripcion_pedido ILIKE $${valores.length} OR articulos.descripcion ILIKE $${valores.length})`
    );
  }

  if (desde) {
    valores.push(desde);
    condiciones.push(`incidencias.creado >= $${valores.length}::date`);
  }
  if (fecha) {
    valores.push(fecha);
    condiciones.push(`incidencias.creado::date = $${valores.length}::date`);
  }
  if (area) {
    valores.push(area);
    condiciones.push(`articulos.id_area = $${valores.length}`);
  }
  if (categoria) {
    valores.push(categoria);
    condiciones.push(`articulos.id_categoria = $${valores.length}`);
  }
  if (asignado) {
    valores.push(asignado);
    condiciones.push(`incidencias.asignado_a = $${valores.length}`);
  }
  if (sinAsignar) {
    valores.push(pendiente, rolDirector);
    condiciones.push(
      `incidencias.id_estado = $${valores.length - 1}
       AND incidencias.asignado_a IN (SELECT id_usuario FROM usuarios WHERE rol = $${valores.length})`
    );
  }

  return {
    where: condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "",
    valores,
  };
}

async function listar(filtros) {
  const { where, valores } = armarFiltros(filtros);
  const { pagina, limite } = filtros;
  const desplazamiento = (pagina - 1) * limite;

  const [filas, conteo] = await Promise.all([
    pool.query(
      `${SELECCION} ${where}
       ORDER BY incidencias.creado DESC, incidencias.id_incidencia DESC
       LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
      [...valores, limite, desplazamiento]
    ),
    pool.query(`SELECT COUNT(*)::int AS total ${DESDE} ${where}`, valores),
  ]);

  return { items: filas.rows, total: conteo.rows[0].total };
}

function buscarPorId(id) {
  return pool
    .query(`${SELECCION} WHERE incidencias.id_incidencia = $1`, [id])
    .then((r) => r.rows[0] || null);
}

function insertar({ id_articulo, id_estado, creado_por, asignado_a, prioridad, descripcion_pedido }) {
  return conTransaccion(async (cliente) => {
    const alta = await cliente.query(
      `INSERT INTO incidencias
         (id_articulo, id_estado, creado_por, asignado_a, creado, prioridad, descripcion_pedido, descripcion_resolucion)
       VALUES ($1, $2, $3, $4, now(), $5, $6, NULL)
       RETURNING *`,
      [id_articulo, id_estado, creado_por, asignado_a, prioridad, descripcion_pedido]
    );

    const incidencia = alta.rows[0];

    await cliente.query(
      `INSERT INTO incidencias_estados (id_incidencia, id_estado, fecha_hora_estado)
       VALUES ($1, $2, now())`,
      [incidencia.id_incidencia, id_estado]
    );

    return incidencia;
  });
}

// "desde" son los estados en los que tiene que estar la incidencia para cambiar: si otro
// pedido la cambió antes, el UPDATE no afecta filas y se devuelve null.
function cambiarEstado(id, idEstado, { descripcion_resolucion, desde }) {
  return conTransaccion(async (cliente) => {
    const cambio = await cliente.query(
      `UPDATE incidencias
       SET id_estado = $1,
           descripcion_resolucion = COALESCE($2, descripcion_resolucion)
       WHERE id_incidencia = $3 AND id_estado = ANY($4)
       RETURNING *`,
      [idEstado, descripcion_resolucion ?? null, id, desde]
    );

    if (cambio.rowCount === 0) return null;

    await cliente.query(
      `INSERT INTO incidencias_estados (id_incidencia, id_estado, fecha_hora_estado)
       VALUES ($1, $2, now())`,
      [id, idEstado]
    );

    return cambio.rows[0];
  });
}

function asignar(id, asignadoA, idEstado, desde) {
  return conTransaccion(async (cliente) => {
    const cambio = await cliente.query(
      `UPDATE incidencias
       SET asignado_a = $1, id_estado = $2
       WHERE id_incidencia = $3 AND id_estado = ANY($4)
       RETURNING *`,
      [asignadoA, idEstado, id, desde]
    );

    if (cambio.rowCount === 0) return null;

    await cliente.query(
      `INSERT INTO incidencias_estados (id_incidencia, id_estado, fecha_hora_estado)
       VALUES ($1, $2, now())`,
      [id, idEstado]
    );

    return cambio.rows[0];
  });
}

function contarAsignadasEnEstados(idUsuario, estados) {
  return pool
    .query(`SELECT COUNT(*)::int AS total
            FROM incidencias
            WHERE asignado_a = $1 AND id_estado = ANY($2)`, [idUsuario, estados])
    .then((r) => r.rows[0].total);
}

export { listar, buscarPorId, insertar, cambiarEstado, asignar, contarAsignadasEnEstados };
