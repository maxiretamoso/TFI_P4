import { AVATARES_PREDEFINIDOS, archivoDelPredefinido } from "../config/avatares.js";

function listarPredefinidos() {
  return AVATARES_PREDEFINIDOS.map((id) => ({ id, avatar: archivoDelPredefinido(id) }));
}

export { listarPredefinidos };
