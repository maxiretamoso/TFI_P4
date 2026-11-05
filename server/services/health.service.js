const healthDatos = require("../datos/health.datos");

function verificarConexion() {
  return healthDatos.verificarConexion();
}

module.exports = { verificarConexion };
