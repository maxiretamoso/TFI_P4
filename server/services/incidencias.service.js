const pool = require("../db");
const { crearError } = require("../utils/httpError");
const { enviarMail } = require("../utils/email");

// Base select with joins (movido desde routes/incidencias.js sin cambios)
const SELECT_BASE = `
  SELECT
    incidencias.id_incidencia,
    incidencias.descripcion_pedido,
    incidencias.descripcion_resolucion,
    incidencias.prioridad,
    incidencias.creado,
    incidencias.creado_por,
    incidencias.asignado_a,
    incidencias.id_articulo,
    incidencias.id_estado,
    estados.descripcion AS estado,
    articulos.descripcion AS articulo_descripcion,
    creador.nombres AS creado_por_nombre,
    creador.apellidos AS creado_por_apellido,
    asignado.nombres AS asignado_a_nombre,
    asignado.apellidos AS asignado_a_apellido
  FROM incidencias
  JOIN estados ON incidencias.id_estado = estados.id_estado
  JOIN articulos ON incidencias.id_articulo = articulos.id_articulo
  JOIN usuarios AS creador ON incidencias.creado_por = creador.id_usuario
  LEFT JOIN usuarios AS asignado ON incidencias.asignado_a = asignado.id_usuario
`;

// Filtrado por rol según enunciado:
// 1 = empleado municipal -> solo sus incidencias (creado_por = id)
// 2 = empleado sistemas -> solo asignadas a él (asignado_a = id)
// 3 = director -> todas
async function listar(rol, id_usuario) {
  let where = "";
  let params = [];
  if (rol === 1) {
    where = "WHERE incidencias.creado_por = $1";
    params = [id_usuario];
  } else if (rol === 2) {
    where = "WHERE incidencias.asignado_a = $1";
    params = [id_usuario];
  } else {
    where = "";
    params = [];
  }
  const q = `${SELECT_BASE} ${where} ORDER BY incidencias.creado DESC`;
  const resultado = await pool.query(q, params);
  return resultado.rows;
}

async function listarMias(id_usuario) {
  const r = await pool.query(
    `${SELECT_BASE} WHERE incidencias.creado_por=$1 ORDER BY creado DESC`,
    [id_usuario],
  );
  return r.rows;
}

async function listarAsignadas(id_usuario) {
  const r = await pool.query(
    `${SELECT_BASE} WHERE incidencias.asignado_a=$1 ORDER BY creado DESC`,
    [id_usuario],
  );
  return r.rows;
}

async function listarTodas() {
  const r = await pool.query(`${SELECT_BASE} ORDER BY creado DESC`);
  return r.rows;
}

async function obtenerPorId(id, { rol, id_usuario }) {
  const r = await pool.query(`${SELECT_BASE} WHERE incidencias.id_incidencia=$1`, [id]);
  if (r.rows.length === 0) throw crearError(404, "Incidencia no encontrada");
  // Control de acceso: municipal solo ve las suyas, sistemas solo asignadas, director ve todo
  const inc = r.rows[0];
  if (rol === 1 && inc.creado_por !== id_usuario)
    throw crearError(403, "No autorizado");
  if (rol === 2 && inc.asignado_a !== id_usuario && rol !== 3) {
    // empleado sistemas que no es el asignado no puede ver (director sí)
    // permitir si aún no asignada y es sistemas? decidimos denegar si no es suya
    throw crearError(403, "No autorizado: no está asignada a vos");
  }
  return inc;
}

async function crear({ id_articulo, prioridad, descripcion_pedido, descripcion_resolucion, id_estado, creado_por }) {
  // id_estado por defecto PENDIENTE = 1
  const estadoFinal = id_estado || 1;
  // La tabla exige asignado_a NOT NULL: se autoasigna temporalmente al creador
  // hasta que el Director la reasigne a un empleado de Sistemas real.
  const asignado_a = creado_por;
  const r = await pool.query(
    `INSERT INTO incidencias (id_estado, creado_por, asignado_a, creado, prioridad, id_articulo, descripcion_pedido, descripcion_resolucion)
     VALUES ($1,$2,$3, now(), $4,$5,$6,$7) RETURNING *`,
    [estadoFinal, creado_por, asignado_a, prioridad, id_articulo, descripcion_pedido, descripcion_resolucion || null],
  );
  const inc = r.rows[0];
  // historial
  await pool.query(
    `INSERT INTO incidencias_estados (id_incidencia, id_estado, fecha_hora_estado) VALUES ($1,$2, now())`,
    [inc.id_incidencia, estadoFinal],
  );
  return inc;
}

async function cancelar(id, { rol, id_usuario }) {
  const q = await pool.query(`SELECT * FROM incidencias WHERE id_incidencia=$1`, [id]);
  if (q.rows.length === 0) throw crearError(404, "Incidencia no encontrada");
  const inc = q.rows[0];

  // Solo si está pendiente (1)
  if (inc.id_estado !== 1)
    throw crearError(400, "Solo se pueden cancelar incidencias PENDIENTES");

  // Permisos: municipal solo propias, director cualquiera pendiente, sistemas NO puede cancelar
  if (rol === 1 && inc.creado_por !== id_usuario)
    throw crearError(403, "Solo podés cancelar tus propias incidencias");
  if (rol === 2)
    throw crearError(403, "Empleado de sistemas no puede cancelar incidencias");
  if (rol !== 1 && rol !== 3)
    throw crearError(403, "Rol no autorizado para cancelar");

  const upd = await pool.query(
    `UPDATE incidencias SET id_estado=4 WHERE id_incidencia=$1 RETURNING *`,
    [id],
  );
  await pool.query(
    `INSERT INTO incidencias_estados (id_incidencia, id_estado, fecha_hora_estado) VALUES ($1,4, now())`,
    [id],
  );

  // email al creador (no bloquea la respuesta si falla)
  try {
    const creador = await pool.query(
      `SELECT usuario, nombres, apellidos FROM usuarios WHERE id_usuario=$1`,
      [inc.creado_por],
    );
    const to = creador.rows[0] ? `${creador.rows[0].usuario}@example.com` : null;
    // Si existe columna email real, usarla; por ahora usuario como placeholder o env var
    const dest = process.env.MAIL_TO_TEST || to;
    if (dest) {
      await enviarMail({
        to: dest,
        subject: `Incidencia #${id} cancelada`,
        text: `Tu incidencia #${id} fue cancelada.`,
        html: `<p>Tu incidencia <b>#${id}</b> fue cancelada por ${rol === 3 ? "el Director" : "vos"}.</p><p>${inc.descripcion_pedido}</p>`,
      });
    }
  } catch (mailErr) {
    console.error("Error enviando mail cancelación:", mailErr.message);
  }

  return upd.rows[0];
}

async function finalizar(id, { descripcion_resolucion, rol, id_usuario }) {
  const q = await pool.query(`SELECT * FROM incidencias WHERE id_incidencia=$1`, [id]);
  if (q.rows.length === 0) throw crearError(404, "Incidencia no encontrada");
  const inc = q.rows[0];

  // Solo puede finalizar si está ASIGNADA (2) o PENDIENTE? Según flujo debería ser ASIGNADA, pero permitimos PENDIENTE asignada previamente
  if (inc.id_estado === 3) throw crearError(400, "La incidencia ya está FINALIZADA");
  if (inc.id_estado === 4)
    throw crearError(400, "La incidencia está CANCELADA, no se puede finalizar");

  // Si es empleado sistemas, debe estar asignada a él
  if (rol === 2 && inc.asignado_a !== id_usuario) {
    throw crearError(403, "Solo podés finalizar incidencias asignadas a vos");
  }

  const upd = await pool.query(
    `UPDATE incidencias SET id_estado=3, descripcion_resolucion=$1 WHERE id_incidencia=$2 RETURNING *`,
    [descripcion_resolucion, id],
  );
  await pool.query(
    `INSERT INTO incidencias_estados (id_incidencia, id_estado, fecha_hora_estado) VALUES ($1,3, now())`,
    [id],
  );

  try {
    const creador = await pool.query(`SELECT usuario FROM usuarios WHERE id_usuario=$1`, [inc.creado_por]);
    const dest =
      process.env.MAIL_TO_TEST || (creador.rows[0] ? `${creador.rows[0].usuario}@example.com` : null);
    if (dest) {
      await enviarMail({
        to: dest,
        subject: `Incidencia #${id} finalizada`,
        text: `Tu incidencia #${id} fue finalizada. Resolución: ${descripcion_resolucion}`,
        html: `<p>Tu incidencia <b>#${id}</b> fue finalizada.</p><p>Resolución: ${descripcion_resolucion}</p>`,
      });
    }
  } catch (mailErr) {
    console.error("Error enviando mail finalización:", mailErr.message);
  }

  return upd.rows[0];
}

async function asignar(id, { asignado_a }) {
  // Validar que asignado_a sea empleado sistemas (rol 2) activo
  const u = await pool.query(`SELECT id_usuario, rol, activo FROM usuarios WHERE id_usuario=$1`, [asignado_a]);
  if (u.rows.length === 0) throw crearError(404, "Usuario a asignar no encontrado");
  if (u.rows[0].rol !== 2)
    throw crearError(400, "Solo se puede asignar a un empleado de sistemas (rol 2)");
  if (u.rows[0].activo !== 1) throw crearError(400, "Usuario inactivo");

  const q = await pool.query(`SELECT * FROM incidencias WHERE id_incidencia=$1`, [id]);
  if (q.rows.length === 0) throw crearError(404, "Incidencia no encontrada");
  if (q.rows[0].id_estado === 3 || q.rows[0].id_estado === 4) {
    throw crearError(400, "No se puede asignar una incidencia finalizada o cancelada");
  }

  const upd = await pool.query(
    `UPDATE incidencias SET asignado_a=$1, id_estado=2 WHERE id_incidencia=$2 RETURNING *`,
    [asignado_a, id],
  );
  await pool.query(
    `INSERT INTO incidencias_estados (id_incidencia, id_estado, fecha_hora_estado) VALUES ($1,2, now())`,
    [id],
  );
  return upd.rows[0];
}

module.exports = {
  listar,
  listarMias,
  listarAsignadas,
  listarTodas,
  obtenerPorId,
  crear,
  cancelar,
  finalizar,
  asignar,
};
