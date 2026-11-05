const incidenciasDatos = require("../datos/incidencias.datos");
const usuariosDatos = require("../datos/usuarios.datos");
const articulosDatos = require("../datos/articulos.datos");
const { crearError } = require("../utils/httpError");
const { enviarNotificacionDeIncidencia } = require("./notificaciones.service");
const { ROLES } = require("../config/roles");
const { ESTADOS } = require("../config/estados");

const LIMITE_POR_DEFECTO = 20;
const LIMITE_MAXIMO = 100;

function filtroSegunRol({ rol, id_usuario }) {
  if (rol === ROLES.EMPLEADO_MUNICIPAL) return { creadoPor: id_usuario };
  if (rol === ROLES.EMPLEADO_SISTEMAS) return { asignadoA: id_usuario };
  return {};
}

function puedeVer(incidencia, { rol, id_usuario }) {
  if (rol === ROLES.DIRECTOR) return true;
  if (rol === ROLES.EMPLEADO_MUNICIPAL) return incidencia.creado_por === id_usuario;
  return incidencia.asignado_a === id_usuario;
}

function aEntero(valor, porDefecto) {
  const numero = parseInt(valor, 10);
  return Number.isNaN(numero) ? porDefecto : numero;
}

async function listar(solicitante, consulta = {}) {
  const pagina = Math.max(aEntero(consulta.pagina, 1), 1);
  const limite = Math.min(Math.max(aEntero(consulta.limite, LIMITE_POR_DEFECTO), 1), LIMITE_MAXIMO);

  const { items, total } = await incidenciasDatos.listar({
    ...filtroSegunRol(solicitante),
    estado: consulta.estado ? aEntero(consulta.estado, null) : null,
    prioridad: consulta.prioridad ? aEntero(consulta.prioridad, null) : null,
    buscar: consulta.buscar || null,
    pagina,
    limite,
  });

  return { items, total, pagina, limite, paginas: Math.max(Math.ceil(total / limite), 1) };
}

async function obtenerPorId(id, solicitante) {
  const incidencia = await incidenciasDatos.buscarPorId(id);
  if (!incidencia) throw crearError(404, "Incidencia no encontrada");
  if (!puedeVer(incidencia, solicitante)) throw crearError(403, "No tenés acceso a esta incidencia");
  return incidencia;
}

// asignado_a es NOT NULL: nace a cargo del Director hasta que la asigne.
async function crear({ id_articulo, prioridad, descripcion_pedido }, solicitante) {
  const articulo = await articulosDatos.buscarPorId(id_articulo);
  if (!articulo || articulo.activo !== 1) throw crearError(400, "El artículo indicado no existe");

  const director = await usuariosDatos.buscarDirectorActivo();
  if (!director) {
    throw crearError(409, "No hay un Director activo que pueda recibir la incidencia");
  }

  return incidenciasDatos.insertar({
    id_articulo,
    id_estado: ESTADOS.PENDIENTE,
    creado_por: solicitante.id_usuario,
    asignado_a: director.id_usuario,
    prioridad,
    descripcion_pedido,
  });
}

async function asignar(id, asignadoA) {
  const empleado = await usuariosDatos.buscarPorId(asignadoA);
  if (!empleado) throw crearError(404, "El usuario indicado no existe");
  if (empleado.rol !== ROLES.EMPLEADO_SISTEMAS) {
    throw crearError(400, "Solo se puede asignar a un empleado del área de Sistemas");
  }
  if (empleado.activo !== 1) throw crearError(400, "El empleado está dado de baja");

  const incidencia = await incidenciasDatos.buscarPorId(id);
  if (!incidencia) throw crearError(404, "Incidencia no encontrada");
  if (incidencia.id_estado === ESTADOS.RESUELTA || incidencia.id_estado === ESTADOS.CANCELADA) {
    throw crearError(409, "No se puede asignar una incidencia resuelta o cancelada");
  }

  return incidenciasDatos.asignar(id, asignadoA, ESTADOS.EN_PROCESO);
}

async function finalizar(id, descripcionResolucion, solicitante) {
  const incidencia = await incidenciasDatos.buscarPorId(id);
  if (!incidencia) throw crearError(404, "Incidencia no encontrada");

  if (incidencia.id_estado === ESTADOS.RESUELTA) throw crearError(409, "La incidencia ya está resuelta");
  if (incidencia.id_estado === ESTADOS.CANCELADA) throw crearError(409, "La incidencia está cancelada");

  if (solicitante.rol === ROLES.EMPLEADO_SISTEMAS && incidencia.asignado_a !== solicitante.id_usuario) {
    throw crearError(403, "Solo podés finalizar incidencias asignadas a vos");
  }

  const actualizada = await incidenciasDatos.cambiarEstado(id, ESTADOS.RESUELTA, {
    descripcion_resolucion: descripcionResolucion,
  });

  await enviarNotificacionDeIncidencia({
    incidencia,
    estado: "finalizada",
    resolucion: descripcionResolucion,
  });

  return actualizada;
}

async function cancelar(id, solicitante) {
  const incidencia = await incidenciasDatos.buscarPorId(id);
  if (!incidencia) throw crearError(404, "Incidencia no encontrada");

  if (incidencia.id_estado !== ESTADOS.PENDIENTE) {
    throw crearError(409, "Solo se pueden cancelar incidencias pendientes");
  }

  if (
    solicitante.rol === ROLES.EMPLEADO_MUNICIPAL &&
    incidencia.creado_por !== solicitante.id_usuario
  ) {
    throw crearError(403, "Solo podés cancelar las incidencias que creaste");
  }

  const actualizada = await incidenciasDatos.cambiarEstado(id, ESTADOS.CANCELADA);

  await enviarNotificacionDeIncidencia({ incidencia, estado: "cancelada" });

  return actualizada;
}

module.exports = { listar, obtenerPorId, crear, asignar, finalizar, cancelar };
