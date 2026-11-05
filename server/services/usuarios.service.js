const usuariosDatos = require("../datos/usuarios.datos");
const areasDatos = require("../datos/areas.datos");
const { crearError } = require("../utils/httpError");
const { ROLES } = require("../config/roles");
const { hashearContrasenia } = require("./auth.service");

const CODIGO_CLAVE_DUPLICADA = "23505";

function esDirector(solicitante) {
  return solicitante && solicitante.rol === ROLES.DIRECTOR;
}

function esElMismo(id, solicitante) {
  return solicitante && Number(id) === solicitante.id_usuario;
}

function listarUsuarios() {
  return usuariosDatos.listar();
}

function listarEmpleadosDeSistemas() {
  return usuariosDatos.listarEmpleadosDeSistemas();
}

async function obtenerUsuarioPorId(id) {
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

  const id_area = datos.id_area ?? actual.id_area;
  if (id_area !== actual.id_area && !(await areasDatos.buscarPorId(id_area))) {
    throw crearError(400, "El área indicada no existe");
  }

  const hash = datos.contrasenia
    ? await hashearContrasenia(datos.contrasenia)
    : actual.contrasenia;

  try {
    return await usuariosDatos.actualizar(id, {
      id_area,
      nombres: datos.nombres ?? actual.nombres,
      apellidos: datos.apellidos ?? actual.apellidos,
      usuario: datos.usuario ?? actual.usuario,
      hash,
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
  const usuario = await usuariosDatos.desactivar(id);
  if (!usuario) throw crearError(404, "Usuario no encontrado");
  return usuario;
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
