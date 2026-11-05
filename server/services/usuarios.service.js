const usuariosDatos = require("../datos/usuarios.datos");
const areasDatos = require("../datos/areas.datos");
const incidenciasDatos = require("../datos/incidencias.datos");
const { crearError } = require("../utils/httpError");
const { ROLES } = require("../config/roles");
const { ESTADOS } = require("../config/estados");
const { hashearContrasenia } = require("./auth.service");

const CODIGO_CLAVE_DUPLICADA = "23505";

function esDirector(solicitante) {
  return solicitante && solicitante.rol === ROLES.DIRECTOR;
}

function esElMismo(id, solicitante) {
  return solicitante && Number(id) === solicitante.id_usuario;
}

// Un empleado de Sistemas con incidencias abiertas no puede dejar de serlo: quedarían sin responsable.
async function exigirSinIncidenciasAbiertas(usuario, accion) {
  if (usuario.rol !== ROLES.EMPLEADO_SISTEMAS) return;
  const abiertas = await incidenciasDatos.contarAsignadasEnEstados(usuario.id_usuario, [
    ESTADOS.PENDIENTE,
    ESTADOS.EN_PROCESO,
  ]);
  if (abiertas > 0) {
    throw crearError(
      409,
      `No se puede ${accion}: tiene ${abiertas} incidencia${abiertas === 1 ? "" : "s"} abierta${abiertas === 1 ? "" : "s"} asignada${abiertas === 1 ? "" : "s"}. Reasignalas primero.`
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

async function crearUsuario(datos) {
  const area = await areasDatos.buscarPorId(datos.id_area);
  if (!area) throw crearError(400, "El área indicada no existe");

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
  if (cambiaRol) await exigirSinIncidenciasAbiertas(actual, "cambiarle el rol");

  const id_area = datos.id_area ?? actual.id_area;
  if (id_area !== actual.id_area && !(await areasDatos.buscarPorId(id_area))) {
    throw crearError(400, "El área indicada no existe");
  }

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
  await exigirSinIncidenciasAbiertas(actual, "darlo de baja");

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

module.exports = {
  listarUsuarios,
  listarEmpleadosDeSistemas,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  desactivarUsuario,
  actualizarAvatar,
};
