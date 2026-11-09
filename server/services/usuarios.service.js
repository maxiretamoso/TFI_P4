import * as usuariosDatos from "../datos/usuarios.datos.js";
import * as areasDatos from "../datos/areas.datos.js";
import * as incidenciasDatos from "../datos/incidencias.datos.js";
import { crearError } from "../utils/httpError.js";
import { ROLES } from "../config/roles.js";
import { ESTADOS } from "../config/estados.js";
import { AREA_SISTEMAS } from "../config/areas.js";
import { hashearContrasenia } from "./auth.service.js";

const CODIGO_CLAVE_DUPLICADA = "23505";

function esDirector(solicitante) {
  return solicitante && solicitante.rol === ROLES.DIRECTOR;
}

function esElMismo(id, solicitante) {
  return solicitante && Number(id) === solicitante.id_usuario;
}

// Un empleado de Sistemas con incidencias sin resolver no puede dejar de serlo: quedarían sin responsable.
async function exigirSinIncidenciasSinResolver(usuario, accion) {
  if (usuario.rol !== ROLES.EMPLEADO_SISTEMAS) return;
  const sinResolver = await incidenciasDatos.contarAsignadasEnEstados(usuario.id_usuario, [
    ESTADOS.PENDIENTE,
    ESTADOS.EN_PROCESO,
  ]);
  if (sinResolver > 0) {
    throw crearError(
      409,
      `No se puede ${accion}: tiene ${sinResolver} incidencia${sinResolver === 1 ? "" : "s"} sin resolver asignada${sinResolver === 1 ? "" : "s"}. Reasignalas primero.`
    );
  }
}

function listarUsuarios() {
  return usuariosDatos.listar();
}

function listarEmpleadosDeSistemas() {
  return usuariosDatos.listarEmpleadosDeSistemas();
}

async function obtenerUsuarioPorId(id, solicitante) {
  if (!esDirector(solicitante) && !esElMismo(id, solicitante)) {
    throw crearError(403, "Solo podés ver tu propio perfil");
  }
  const usuario = await usuariosDatos.buscarPorId(id);
  if (!usuario) throw crearError(404, "Usuario no encontrado");
  return usuario;
}

// El Director y los empleados de Sistemas son del área Sistemas; el Municipal elige.
async function validarArea(id_area, rol) {
  const area = await areasDatos.buscarPorId(id_area);
  if (!area || area.activo !== 1) throw crearError(400, "El área indicada no existe");
  if ([ROLES.DIRECTOR, ROLES.EMPLEADO_SISTEMAS].includes(Number(rol)) && Number(id_area) !== AREA_SISTEMAS) {
    throw crearError(400, "El Director y los empleados de Sistemas pertenecen al área Sistemas");
  }
}

async function crearUsuario(datos) {
  await validarArea(datos.id_area, datos.rol);

  try {
    return await usuariosDatos.insertar({
      ...datos,
      hash: await hashearContrasenia(datos.contrasenia),
    });
  } catch (error) {
    if (error.code === CODIGO_CLAVE_DUPLICADA) {
      throw crearError(409, "Ya existe un usuario con ese correo");
    }
    throw error;
  }
}

async function actualizarUsuario(id, datos, solicitante) {
  if (!esDirector(solicitante) && !esElMismo(id, solicitante)) {
    throw crearError(403, "Solo podés editar tu propio perfil");
  }

  const actual = await usuariosDatos.buscarCredencialesPorId(id);
  if (!actual) throw crearError(404, "Usuario no encontrado");

  if (!esDirector(solicitante)) {
    const cambiaRol = datos.rol !== undefined && Number(datos.rol) !== actual.rol;
    const cambiaArea = datos.id_area !== undefined && Number(datos.id_area) !== actual.id_area;
    if (cambiaRol || cambiaArea) {
      throw crearError(403, "Solo el Director puede cambiar el rol o el área");
    }
  }

  const cambiaRol = datos.rol !== undefined && Number(datos.rol) !== actual.rol;
  if (cambiaRol && esElMismo(id, solicitante)) {
    throw crearError(400, "No podés cambiar tu propio rol");
  }
  if (cambiaRol) await exigirSinIncidenciasSinResolver(actual, "cambiarle el rol");

  const id_area = datos.id_area ?? actual.id_area;
  await validarArea(id_area, datos.rol ?? actual.rol);

  try {
    return await usuariosDatos.actualizar(id, {
      id_area,
      nombres: datos.nombres ?? actual.nombres,
      apellidos: datos.apellidos ?? actual.apellidos,
      usuario: datos.usuario ?? actual.usuario,
      rol: datos.rol ?? actual.rol,
    });
  } catch (error) {
    if (error.code === CODIGO_CLAVE_DUPLICADA) {
      throw crearError(409, "Ya existe un usuario con ese correo");
    }
    throw error;
  }
}

async function desactivarUsuario(id, solicitante) {
  if (esElMismo(id, solicitante)) {
    throw crearError(400, "No podés darte de baja a vos mismo");
  }
  const actual = await usuariosDatos.buscarCredencialesPorId(id);
  if (!actual) throw crearError(404, "Usuario no encontrado");
  await exigirSinIncidenciasSinResolver(actual, "darlo de baja");

  return usuariosDatos.desactivar(id);
}

async function actualizarAvatar(id, nombreArchivo, solicitante) {
  if (!esDirector(solicitante) && !esElMismo(id, solicitante)) {
    throw crearError(403, "Solo podés cambiar tu propio avatar");
  }
  const usuario = await usuariosDatos.actualizarAvatar(id, nombreArchivo);
  if (!usuario) throw crearError(404, "Usuario no encontrado");
  return usuario;
}

export {
  listarUsuarios,
  listarEmpleadosDeSistemas,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  desactivarUsuario,
  actualizarAvatar,
};
