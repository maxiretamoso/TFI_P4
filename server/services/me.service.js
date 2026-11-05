import * as usuariosDatos from "../datos/usuarios.datos.js";
import { crearError } from "../utils/httpError.js";

async function obtenerPerfil(idUsuario) {
  const perfil = await usuariosDatos.buscarPerfil(idUsuario);
  if (!perfil) throw crearError(404, "Usuario no encontrado");
  return perfil;
}

export { obtenerPerfil };
