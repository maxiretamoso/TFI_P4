const usuariosDatos = require("../datos/usuarios.datos");
const { crearError } = require("../utils/httpError");

async function obtenerPerfil(idUsuario) {
  const perfil = await usuariosDatos.buscarPerfil(idUsuario);
  if (!perfil) throw crearError(404, "Usuario no encontrado");
  return perfil;
}

module.exports = { obtenerPerfil };
