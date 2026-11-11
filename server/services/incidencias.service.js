import * as incidenciasDatos from "../datos/incidencias.datos.js";
import * as usuariosDatos from "../datos/usuarios.datos.js";
import * as articulosDatos from "../datos/articulos.datos.js";
import { crearError } from "../utils/httpError.js";
import { enviarNotificacionDeIncidencia } from "./notificaciones.service.js";
import { ROLES, ESTADOS, SIN_RESOLVER } from "../config/constantes.js";

const LIMITE_POR_DEFECTO = 15;
const LIMITE_MAXIMO = 100;

const CAMBIO_SIMULTANEO = "La incidencia cambió de estado mientras tanto. Recargá la lista y probá de nuevo.";

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

  const { items, total, totalSinFiltros, primerAnio } = await incidenciasDatos.listar({
    ...filtroSegunRol(solicitante),
    estados: consulta.estado ? consulta.estado.split(",").map(Number) : null,
    prioridad: consulta.prioridad ? aEntero(consulta.prioridad, null) : null,
    buscar: consulta.buscar || null,
    desde: consulta.desde || null,
    fecha: consulta.fecha || null,
    area: consulta.area ? aEntero(consulta.area, null) : null,
    categoria: consulta.categoria ? aEntero(consulta.categoria, null) : null,
    asignado: consulta.asignado ? aEntero(consulta.asignado, null) : null,
    sinAsignar: consulta.sin_asignar === "true" || consulta.sin_asignar === "1",
    pagina,
    limite,
  });

  return {
    items,
    total,
    total_sin_filtros: totalSinFiltros,
    primer_anio: primerAnio,
    pagina,
    limite,
    paginas: Math.max(Math.ceil(total / limite), 1),
  };
}

async function obtenerPorId(id, solicitante) {
  const incidencia = await incidenciasDatos.buscarPorId(id);
  if (!incidencia) throw crearError(404, "Incidencia no encontrada");
  if (!puedeVer(incidencia, solicitante)) throw crearError(403, "No tenés acceso a esta incidencia");
  return incidencia;
}

// Nace Pendiente y sin asignar (asignado_a en NULL) hasta que el Director elija a alguien de Sistemas.
async function crear({ id_articulo, prioridad, descripcion_pedido }, solicitante) {
  const articulo = await articulosDatos.buscarPorId(id_articulo);
  if (!articulo || articulo.activo !== 1) throw crearError(400, "El artículo indicado no existe");
  if (articulo.id_area !== solicitante.id_area) {
    throw crearError(403, "Solo podés reportar artículos de tu área");
  }

  return incidenciasDatos.insertar({
    id_articulo,
    id_estado: ESTADOS.PENDIENTE,
    creado_por: solicitante.id_usuario,
    asignado_a: null,
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

  const actualizada = await incidenciasDatos.asignar(id, asignadoA, ESTADOS.EN_PROCESO, SIN_RESOLVER);
  if (!actualizada) throw crearError(409, CAMBIO_SIMULTANEO);
  return actualizada;
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
    desde: SIN_RESOLVER,
  });
  if (!actualizada) throw crearError(409, CAMBIO_SIMULTANEO);

  // El correo sale en segundo plano para no demorar la respuesta.
  enviarNotificacionDeIncidencia({
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

  const actualizada = await incidenciasDatos.cambiarEstado(id, ESTADOS.CANCELADA, {
    desde: [ESTADOS.PENDIENTE],
  });
  if (!actualizada) throw crearError(409, CAMBIO_SIMULTANEO);

  enviarNotificacionDeIncidencia({ incidencia, estado: "cancelada" });

  return actualizada;
}

export { listar, obtenerPorId, crear, asignar, finalizar, cancelar };
