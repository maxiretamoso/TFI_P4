const incidenciasEstadosDatos = require("../datos/incidencias_estados.datos");

function listarHistorial() {
  return incidenciasEstadosDatos.listar();
}

function listarHistorialDeIncidencia(idIncidencia) {
  return incidenciasEstadosDatos.listarPorIncidencia(idIncidencia);
}

module.exports = { listarHistorial, listarHistorialDeIncidencia };
