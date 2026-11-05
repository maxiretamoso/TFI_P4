const { AVATARES_PREDEFINIDOS, archivoDelPredefinido } = require("../config/avatares");

function listarPredefinidos() {
  return AVATARES_PREDEFINIDOS.map((id) => ({ id, avatar: archivoDelPredefinido(id) }));
}

module.exports = { listarPredefinidos };
